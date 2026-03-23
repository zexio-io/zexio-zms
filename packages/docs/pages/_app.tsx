import '../styles/globals.css';
import { useRouter } from 'next/router';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Very simple hybrid routing check.
  // If the path does not start with /docs, we render the Component naked 
  // without Nextra's layout, to allow for custom Landing Pages.
  // Note: Nextra's '_app' handling usually wraps `Component` automatically.
  // By using Nextra 3, we define `layout: "raw"` in frontmatter of non-docs files
  // OR we can just let Nextra handle it and we define pages outside `pages/docs` as standard.
  // In `pages/index.tsx`, we won't use .mdx, so Nextra won't inject the docs layout anyway.

  return <Component {...pageProps} />;
}
