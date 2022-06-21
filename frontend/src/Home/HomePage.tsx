import React, { useCallback } from 'react';
import styled from 'styled-components';

declare global {
  interface Window {
    keplr: any;
  }
}

const HomePage = () => {
  const onClick = useCallback(async () => {
    if (typeof window.keplr === 'undefined') {
      window.alert('Please install keplr extension');
      return;
    }

    try {
      const chainId = 'cosmoshub-4';
      await window.keplr.enable(chainId);

      const offlineSigner = window.keplr.getOfflineSignerOnlyAmino(chainId);
      const accounts = await offlineSigner.getAccounts();
      const walletAddress = accounts[0].address;
      console.log(walletAddress);

      // const { pub_key: publicKey, signature } =
      //   await window.keplr.signArbitrary(
      //     chainId,
      //     walletAddress,
      //     messageToBeSigned,
      //   );
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <Container>
      <ManythingsLogo src="/assets/manythings.png" />
      <Button onClick={onClick}>Generate Sign</Button>
    </Container>
  );
};

export default HomePage;

const Container = styled.div`
  padding: 56px 0;

  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ManythingsLogo = styled.img`
  max-width: 800px;
  width: 95%;
  image-rendering: pixelated;
`;
const Button = styled.button`
  margin-top: 32px;
  padding: 16px 20px;

  border: 2px solid rgba(255, 255, 255, 0.45);
  border-radius: 16px;
  background-color: black;

  font-family: 'Platform';
  font-weight: 500;
  font-size: 1.2rem;
  color: white;
`;
