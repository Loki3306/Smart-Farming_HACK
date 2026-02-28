# Marketplace Setup Guide

## Overview
The Marketplace now displays **real crop prices** from the Government of India API and shows **actual crop images** from the Agricultural-crops folder.

## API Integration

### API Details
- **API Key**: `579b464db66ec23bdd000001da3481825df4490b5e28de799bad81f3`
- **API Endpoint**: `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070`
- **Data Source**: Government of India Open Data Platform
- **Purpose**: Fetches live market prices for agricultural commodities

### What Data is Fetched
The API provides:
- Commodity name (Rice, Wheat, Tomato, etc.)
- Variety (Basmati, Hybrid, etc.)
- Min, Max, and Modal (most common) prices
- State and District information
- Market name
- Arrival date

## Image Assets

### Agricultural-crops Folder
Location: `/public/Agricultural-crops/`

Contains 30+ crop categories with multiple images each:
- `rice/` - 29 images
- `wheat/` - 31 images
- `tomato/` - 26 images
- `maize/`, `cotton/`, `sugarcane/`, etc.

### Crop Mapping
The system automatically maps commodity names from the API to image folders:
```typescript
'paddy' → 'rice'
'bajra' → 'Pearl_millet(bajra)'
'mung' → 'vigna-radiati(Mung)'
'makhana' → 'Fox_nut(Makhana)'
```

## Features

### 1. Live Price Display
- **Modal Price**: Most common trading price (main display)
- **Min Price**: Lowest market price
- **Max Price**: Highest market price
- **Price Range Bar**: Visual indicator of current price position

### 2. Price Trends
- Shows percentage change between min and modal price
- Green badge with ↑ for price increases
- Red badge with ↓ for price decreases

### 3. Interactive Cards
- Click any crop card to see detailed information
- High-quality images from Agricultural-crops folder
- Fallback to leaf icon if image fails to load

### 4. Search & Filter
- Search by crop name, variety, or state
- Filter by category (All, Seeds, Fertilizers, Produce, etc.)
- Real-time filtering of results

### 5. Detailed Modal View
Shows:
- Full-size crop image
- Complete price breakdown (Min, Modal, Max)
- Market information (location, district, state)
- Arrival date
- Category
- Market insights and tips

## Service Architecture

### CropPriceService.ts
Located: `/client/services/CropPriceService.ts`

**Key Functions:**
1. `fetchCropPrices()` - Fetches data from API with caching (5 min)
2. `getCropDataForMarketplace()` - Transforms API data to UI format
3. `mapCommodityToFolder()` - Maps commodity names to image folders
4. `getCropImage()` - Generates image paths
5. `searchCrops()` - Filters crops by search query

**Caching:**
- 5-minute cache to reduce API calls
- Falls back to sample data if API fails

## Technical Details

### API Request Format
```
GET https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
Query Parameters:
  - api-key: 579b464db66ec23bdd000001da3481825df4490b5e28de799bad81f3
  - format: json
  - limit: 100
  - offset: 0
```

### Image Paths
Images are served from `/public/Agricultural-crops/{folder}/image ({n}).jpg`

Example:
- Rice: `/Agricultural-crops/rice/image (1).jpg`
- Wheat: `/Agricultural-crops/wheat/image (5).jpg`
- Tomato: `/Agricultural-crops/tomato/image (3).jpg`

## Error Handling

1. **API Failure**: Falls back to sample data with 3 crops
2. **Image Load Error**: Shows Leaf icon placeholder
3. **Empty Results**: Displays friendly "No crops found" message
4. **Network Issues**: Shows loading spinner indefinitely until success

## Future Enhancements

### Potential Additions:
1. **State-wise Filtering**: Filter prices by specific states
2. **Historical Trends**: Show price charts over time
3. **Favorites**: Save frequently viewed crops
4. **Price Alerts**: Notify when prices reach target levels
5. **Bulk Purchase**: Request quotes for large quantities
6. **Seller Contact**: Direct messaging to sellers/mandis
7. **Cart & Checkout**: Full e-commerce functionality
8. **Order Tracking**: Track purchases from farm to delivery

## Testing the Marketplace

### Steps to Test:
1. Navigate to Marketplace from sidebar
2. Click "Buy Supplies" tab (default)
3. Wait for crops to load (2-3 seconds)
4. Search for crops: "rice", "wheat", "tomato"
5. Click any crop card to see details
6. Check price trends (green/red badges)
7. Verify images load correctly

### Expected Behavior:
- ✅ 50-100 crop cards display with real prices
- ✅ Each card shows crop image, name, variety, location
- ✅ Price range bar indicates position
- ✅ Click opens detailed modal
- ✅ Search filters results instantly
- ✅ Loading state shows before data loads

## Troubleshooting

### Issue: No crops loading
**Solution**: Check browser console for API errors. If API key expired, update in `CropPriceService.ts`

### Issue: Images not showing
**Solution**: Ensure `/public/Agricultural-crops/` folder exists with images

### Issue: "No crops found"
**Solution**: Clear search and select "All Items" category

### Issue: Slow loading
**Solution**: First load takes 2-3 seconds for API call. Subsequent loads use cache.

## API Rate Limits

The Government of India API has rate limits:
- Unknown exact limit (check API documentation)
- Caching reduces calls to ~1 per 5 minutes per user
- If exceeded, fallback data will be used

## Credits

- **Data**: Government of India Open Data Platform
- **Images**: Agricultural-crops collection (30+ categories, 500+ images)
- **API**: data.gov.in public API service
