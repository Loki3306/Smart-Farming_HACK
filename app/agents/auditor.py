"""
Auditor Agent - Blockchain Audit Trail Logger
Listens for ActionInstruction events
Logs all farming actions to Polygon blockchain via Alchemy
Publishes BlockchainAuditLog events for confirmation tracking
"""

import asyncio
import logging
import json
from datetime import datetime
from typing import Optional

from web3 import Web3
from web3.exceptions import TimeExhausted, ContractLogicError
import redis.asyncio as redis

from app.config import settings
from app.models import ActionInstruction, BlockchainAuditLog

logger = logging.getLogger(__name__)


class AuditorAgent:
    """Blockchain auditor for immutable action logging"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.w3: Optional[Web3] = None
        self.contract = None
        self.account = None
        
    def setup_web3(self):
        """Initialize Web3 connection to Polygon via Alchemy"""
        try:
            # Connect to Polygon Mainnet via Alchemy HTTPS endpoint
            self.w3 = Web3(Web3.HTTPProvider(
                settings.ALCHEMY_HTTPS_URL,
                request_kwargs={'timeout': settings.BLOCKCHAIN_TIMEOUT}
            ))
            
            # Verify connection
            if not self.w3.is_connected():
                raise ConnectionError("Failed to connect to Polygon network")
            
            # Get latest block to verify connection
            latest_block = self.w3.eth.block_number
            logger.info(f"✅ Connected to Polygon Mainnet. Latest block: {latest_block}")
            
            # Setup account if private key is provided
            if settings.BLOCKCHAIN_PRIVATE_KEY:
                self.account = self.w3.eth.account.from_key(settings.BLOCKCHAIN_PRIVATE_KEY)
                logger.info(f"🔑 Loaded blockchain account: {self.account.address}")
            else:
                logger.warning("⚠️ No blockchain private key configured. Transactions disabled.")
            
            # Setup smart contract (if contract address and ABI are configured)
            if settings.CONTRACT_ADDRESS != "0x0000000000000000000000000000000000000000":
                try:
                    contract_abi = json.loads(settings.CONTRACT_ABI)
                    self.contract = self.w3.eth.contract(
                        address=Web3.to_checksum_address(settings.CONTRACT_ADDRESS),
                        abi=contract_abi
                    )
                    logger.info(f"📄 Smart contract loaded: {settings.CONTRACT_ADDRESS}")
                except json.JSONDecodeError:
                    logger.warning("⚠️ Invalid contract ABI format")
            else:
                logger.warning("⚠️ No smart contract configured. Using direct transactions.")
            
        except Exception as e:
            logger.error(f"❌ Web3 setup failed: {str(e)}")
            raise
    
    async def log_action_to_blockchain(
        self,
        action_instruction: ActionInstruction
    ) -> Optional[str]:
        """
        Log farming action to Polygon blockchain
        Returns transaction hash if successful
        """
        try:
            if not self.account:
                logger.warning("⚠️ Cannot log to blockchain: No account configured")
                return None
            
            # Prepare transaction data
            action_data = {
                "farm_id": action_instruction.farm_id,
                "action_type": action_instruction.action_type.value,
                "priority": action_instruction.priority,
                "timestamp": action_instruction.timestamp.isoformat(),
                "trigger_conditions": action_instruction.trigger_conditions,
                "recommended_amount": action_instruction.recommended_amount
            }
            
            # Convert to bytes for blockchain storage
            data_json = json.dumps(action_data)
            data_hex = self.w3.to_hex(text=data_json)
            
            # Build transaction
            if self.contract:
                # Use smart contract method (if you have a custom logging contract)
                tx = await self._send_contract_transaction(action_data)
            else:
                # Use simple value transfer with data (fallback method)
                tx = await self._send_simple_transaction(data_hex)
            
            return tx
            
        except TimeExhausted:
            logger.error("⏰ Blockchain transaction timeout")
            return None
        except ContractLogicError as e:
            logger.error(f"❌ Smart contract error: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"❌ Blockchain logging failed: {str(e)}")
            return None
    
    async def _send_simple_transaction(self, data_hex: str) -> Optional[str]:
        """
        Send a simple transaction with data field
        This is a fallback when no smart contract is available
        """
        try:
            # Get nonce
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            
            # Get current gas price
            gas_price = self.w3.eth.gas_price
            
            # Build transaction
            transaction = {
                'nonce': nonce,
                'to': self.account.address,  # Send to self with data
                'value': 0,  # No MATIC transfer
                'gas': 100000,  # Estimated gas limit
                'gasPrice': gas_price,
                'data': data_hex,
                'chainId': 137  # Polygon Mainnet
            }
            
            # Sign transaction
            signed_tx = self.w3.eth.account.sign_transaction(transaction, self.account.key)
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            tx_hash_hex = self.w3.to_hex(tx_hash)
            
            logger.info(f"📝 Blockchain transaction sent: {tx_hash_hex}")
            
            # Wait for transaction receipt (with timeout)
            try:
                receipt = self.w3.eth.wait_for_transaction_receipt(
                    tx_hash,
                    timeout=60  # Wait up to 60 seconds
                )
                
                if receipt['status'] == 1:
                    logger.info(f"✅ Transaction confirmed in block {receipt['blockNumber']}")
                else:
                    logger.error(f"❌ Transaction failed: {tx_hash_hex}")
                
            except TimeExhausted:
                logger.warning(f"⏰ Transaction pending (not confirmed yet): {tx_hash_hex}")
            
            return tx_hash_hex
            
        except Exception as e:
            logger.error(f"❌ Transaction send failed: {str(e)}")
            return None
    
    async def _send_contract_transaction(self, action_data: dict) -> Optional[str]:
        """
        Call smart contract method to log action
        Requires a deployed smart contract with a logging function
        """
        try:
            # Example: Assuming contract has a logAction function
            # function logAction(uint256 farmId, string memory actionType, string memory data)
            
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            
            # Build contract function call
            tx = self.contract.functions.logAction(
                action_data["farm_id"],
                action_data["action_type"],
                json.dumps(action_data)
            ).build_transaction({
                'nonce': nonce,
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price,
                'chainId': 137
            })
            
            # Sign and send
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            tx_hash_hex = self.w3.to_hex(tx_hash)
            
            logger.info(f"📝 Contract transaction sent: {tx_hash_hex}")
            
            return tx_hash_hex
            
        except Exception as e:
            logger.error(f"❌ Contract transaction failed: {str(e)}")
            return None
    
    async def get_transaction_status(self, tx_hash: str) -> dict:
        """Get transaction receipt and status"""
        try:
            receipt = self.w3.eth.get_transaction_receipt(tx_hash)
            
            return {
                "status": "confirmed" if receipt['status'] == 1 else "failed",
                "block_number": receipt['blockNumber'],
                "gas_used": receipt['gasUsed'],
                "transaction_hash": tx_hash
            }
        except Exception:
            return {
                "status": "pending",
                "transaction_hash": tx_hash
            }
    
    async def process_action_instruction(self, action_instruction: ActionInstruction):
        """Process ActionInstruction and log to blockchain"""
        try:
            logger.info(f"⚖️ Processing action for blockchain audit: {action_instruction.action_type.value}")
            
            # Log to blockchain
            tx_hash = await self.log_action_to_blockchain(action_instruction)
            
            if tx_hash:
                # Get transaction status
                status_info = await self.get_transaction_status(tx_hash)
                
                # Create BlockchainAuditLog event
                audit_log = BlockchainAuditLog(
                    farm_id=action_instruction.farm_id,
                    action_id=0,  # Would be set by database
                    transaction_hash=tx_hash,
                    block_number=status_info.get("block_number"),
                    status=status_info["status"],
                    gas_used=status_info.get("gas_used"),
                    timestamp=datetime.utcnow()
                )
                
                # Publish to Redis
                await self.redis_client.publish(
                    "events:blockchain_audit",
                    audit_log.model_dump_json()
                )
                
                logger.info(f"📤 Published BlockchainAuditLog: {tx_hash}")
            else:
                logger.error("❌ Failed to log action to blockchain")
                
        except Exception as e:
            logger.error(f"❌ Error processing action instruction: {str(e)}")
    
    async def listen_for_action_instructions(self):
        """Subscribe to ActionInstruction events from Redis"""
        try:
            pubsub = self.redis_client.pubsub()
            await pubsub.subscribe("events:action_instruction")
            
            logger.info("👂 Listening for ActionInstruction events...")
            
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        action_instruction = ActionInstruction(**data)
                        
                        # Process in background to avoid blocking
                        asyncio.create_task(
                            self.process_action_instruction(action_instruction)
                        )
                        
                    except Exception as e:
                        logger.error(f"❌ Error parsing ActionInstruction: {str(e)}")
                        
        except Exception as e:
            logger.error(f"❌ Redis subscription error: {str(e)}")


async def start_auditor_listener(redis_client: redis.Redis):
    """
    Initialize and start the Auditor agent
    This runs as a background task in the FastAPI app
    """
    try:
        logger.info("🚀 Starting Auditor Agent...")
        
        agent = AuditorAgent(redis_client)
        agent.setup_web3()
        
        # Start listening for action instructions
        await agent.listen_for_action_instructions()
        
    except Exception as e:
        logger.error(f"❌ Auditor Agent failed: {str(e)}")
        raise
