import { Post } from '@/services/communityApi';

/**
 * Downloads a post as an image using html2canvas
 * @param post The post to download
 * @returns Promise that resolves when download is complete
 */
export async function downloadPostAsImage(post: Post): Promise<void> {
  try {
    // Dynamically import html2canvas
    const html2canvas = (await import('html2canvas')).default;

    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    // Import PostImageCard component
    const { PostImageCard } = await import('@/components/community/PostImageCard');
    const React = await import('react');
    const ReactDOM = await import('react-dom/client');

    // Render the post card
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(PostImageCard, { post }));

    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find the card element
    const cardElement = container.querySelector('#post-image-card') as HTMLElement;
    if (!cardElement) {
      throw new Error('Post card element not found');
    }

    // Capture as canvas
    const canvas = await html2canvas(cardElement, {
      backgroundColor: '#f0fdf4',
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
    });

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to create image blob');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `farming-post-${post.crop || 'tip'}-${Date.now()}.png`;

      link.href = url;
      link.download = filename;
      link.click();

      // Cleanup
      URL.revokeObjectURL(url);
      root.unmount();
      document.body.removeChild(container);
    }, 'image/png');

  } catch (error) {
    console.error('Failed to download post as image:', error);
    throw error;
  }
}

/**
 * Fallback method: Creates a simple canvas-based image without external libraries
 * @param post The post to download
 */
export async function downloadPostAsImageFallback(post: Post): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, 800);
  gradient.addColorStop(0, '#f0fdf4');
  gradient.addColorStop(1, '#d1fae5');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 600, 800);

  // Border
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 580, 780);

  // Header
  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 24px system-ui';
  ctx.fillText(post.author?.name || 'Anonymous', 80, 60);

  ctx.fillStyle = '#6b7280';
  ctx.font = '16px system-ui';
  ctx.fillText(post.author?.location || 'Unknown location', 80, 85);

  // Post type
  const config = await import('@/constants/community').then(m => m.POST_TYPE_CONFIG[post.post_type]);
  if (config) {
    ctx.font = '32px system-ui';
    ctx.fillText(config.emoji, 30, 60);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 18px system-ui';
    ctx.fillText(config.label, 30, 130);
  }

  // Content
  ctx.fillStyle = '#1f2937';
  ctx.font = '18px system-ui';
  const words = post.content.split(' ');
  let line = '';
  let y = 180;

  for (let i = 0; i < words.length && y < 600; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);

    if (metrics.width > 540 && line.length > 0) {
      ctx.fillText(line, 30, y);
      line = words[i] + ' ';
      y += 30;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 30, y);

  // Metadata
  y += 60;
  ctx.font = '16px system-ui';
  if (post.crop) {
    ctx.fillStyle = '#10b981';
    ctx.fillText(`${post.crop}`, 30, y);
    y += 30;
  }
  if (post.method) {
    ctx.fillStyle = '#3b82f6';
    ctx.fillText(`${post.method}`, 30, y);
  }

  // Footer
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 20px system-ui';
  ctx.fillText('Krushi Unnati', 30, 740);

  ctx.fillStyle = '#6b7280';
  ctx.font = '14px system-ui';
  ctx.fillText('AI-Powered Farming Platform', 30, 765);

  // Download
  canvas.toBlob((blob) => {
    if (!blob) {
      throw new Error('Failed to create image');
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `farming-post-${post.crop || 'tip'}-${Date.now()}.png`;

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }, 'image/png');
}
