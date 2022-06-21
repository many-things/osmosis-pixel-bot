import React from 'react';

import { GlobalStyle } from '@/components/GlobalStyle';
import '@/styles/fonts.css';

function MyApp({ Component, pageProps }) {
  return (
    <React.Fragment>
      <GlobalStyle />
      <Component {...pageProps} />
    </React.Fragment>
  );
}

export default MyApp;
