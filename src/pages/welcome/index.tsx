import { Card, Typography } from "antd";

const { Title, Paragraph } = Typography;

export default function WelcomePage() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f5f5f5",
      }}
    >
      <Card
        title="Welcome"
        style={{ width: 480, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
      >
        <Title level={3}>Hello, Claude Apps!</Title>
        <Paragraph>
          This is the welcome page built with Umi + Ant Design 5 + TypeScript.
        </Paragraph>
      </Card>
    </div>
  );
}
