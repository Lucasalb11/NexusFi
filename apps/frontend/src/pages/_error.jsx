
function Error({ statusCode }) {
  const is404 = statusCode === 404;
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgb(8, 12, 21)",
        color: "rgb(235, 235, 240)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          border: "1px solid rgba(191, 163, 107, 0.3)",
          background: "rgb(16, 22, 40)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 32,
        }}
      >
        <span style={{ color: "rgb(191, 163, 107)", fontSize: 24, fontWeight: 700 }}>N</span>
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
        {is404 ? "Página não encontrada" : "Algo deu errado"}
      </h1>
      <p style={{ color: "rgb(148, 155, 175)", fontSize: 14, marginBottom: 24 }}>
        {is404
          ? "A página que você procura não existe."
          : `Ocorreu um erro ${statusCode || ""}. Tente novamente.`}
      </p>
      <a
        href="/"
        style={{
          padding: "12px 24px",
          borderRadius: 12,
          background: "rgba(191, 163, 107, 0.2)",
          border: "1px solid rgba(191, 163, 107, 0.4)",
          color: "rgb(191, 163, 107)",
          textDecoration: "none",
          fontWeight: 500,
        }}
      >
        Voltar ao início
      </a>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
