"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Client, WalletType } from "@web3mq/client";
import ChatWindow from "~~/components/chat/ChatWindow";

const VulnerabilityChat: NextPage = () => {
  const { primaryWallet } = useDynamicContext();
  const [client, setClient] = useState<Client | null>(null);
  const [messages, setMessages] = useState([]);
  const [isLogin, setIsLogin] = useState(false);

  const initializeClient = async () => {
    const fastUrl = await Client.init({
      connectUrl: "https://testnet-ap-jp-1.web3mq.com",
    });
    localStorage.setItem("FAST_URL", fastUrl);
    // setClient(Client.getInstance());
  };

  const login = async () => {
    const password = "123456";
    const didType: WalletType = "eth";

    // 1. Connect wallet and get user
    const { address: didValue } = await Client.register.getAccount(didType);
    const { userid, userExist } = await Client.register.getUserInfo({
      did_value: didValue,
      did_type: didType,
    });

    // 2. Create main key pairs
    const { publicKey: localMainPublicKey, secretKey: localMainPrivateKey } = await Client.register.getMainKeypair({
      password,
      did_value: didValue,
      did_type: didType,
    });

    if (!userExist) {
      // Register user
      const { signContent } = await Client.register.getRegisterSignContent({
        userid,
        mainPublicKey: localMainPublicKey,
        didType,
        didValue,
      });
      const { sign: signature, publicKey: did_pubkey = "" } = await Client.register.sign(
        signContent,
        didValue,
        didType,
      );
      const params = {
        userid,
        didValue,
        mainPublicKey: localMainPublicKey,
        did_pubkey,
        didType,
        nickname: "",
        avatar_url: `https://cdn.stamp.fyi/avatar/${didValue}?s=300`,
        signature,
      };
      await Client.register.register(params);
    }

    // Login user
    const { tempPrivateKey, tempPublicKey, pubkeyExpiredTimestamp, mainPrivateKey, mainPublicKey } =
      await Client.register.login({
        password,
        mainPublicKey: localMainPublicKey,
        mainPrivateKey: localMainPrivateKey,
        userid,
        didType,
        didValue,
      });

    setIsLogin(true);
  };

  const handleJoinVoiceChannel = async () => {
    await initializeClient();
    await login();
  };

  const sendMessage = async (content: string) => {
    if (client) {
      await client.message.sendMessage({ content, to: "some-recipient-id" });
    }
  };

  useEffect(() => {
    if (primaryWallet?.address) {
      initializeClient();
    }
  }, [primaryWallet?.address]);

  return (
    <div>
      <Head>
        <title>Vulnerability Chat</title>
        <meta name="description" content="Chat window for discussing vulnerabilities" />
      </Head>
      <main className="flex items-center justify-center min-h-screen bg-background">
        {isLogin ? (
          <ChatWindow messages={messages} sendMessage={sendMessage} />
        ) : (
          <div>
            <button onClick={handleJoinVoiceChannel}>Join Voice Channel</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default VulnerabilityChat;
