<script lang="ts">
  import './layout.css';
  let { children } = $props();

  const title = "Spur Support - Instant AI Customer Service";
  const desc = "Get 24/7 help with shipping, returns, and products. Spur Support is your smart, always-on AI assistant for immediate customer service.";
  const url = "https://spur-chat.demo";
  const image = "https://spur-chat.demo/og-image.png";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Spur Support",
    "description": desc,
    "url": url,
    "image": image,
    "author": {
        "@type": "Person",
        "name": "Rishi",
        "url": "https://github.com/rishi-rj-s"
    },
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };
</script>

<svelte:head>
  <!-- Basic SEO -->
  <title>{title}</title>
  <meta name="description" content={desc} />
  <meta name="keywords" content="AI chat, customer support, shipping help, returns, Spur, automated support" />
  <meta name="author" content="Rishi (https://github.com/rishi-rj-s)" />
  <link rel="canonical" href={url} />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content={url} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={desc} />
  <meta property="og:image" content={image} />

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content={url} />
  <meta property="twitter:title" content={title} />
  <meta property="twitter:description" content={desc} />
  <meta property="twitter:image" content={image} />

  <!-- Schema.org JSON-LD -->
  {@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
</svelte:head>

{@render children()}
