const CODIGOS_L = {
  0: "0001101",
  1: "0011001",
  2: "0010011",
  3: "0111101",
  4: "0100011",
  5: "0110001",
  6: "0101111",
  7: "0111011",
  8: "0110111",
  9: "0001011",
};

const CODIGOS_G = {
  0: "0100111",
  1: "0110011",
  2: "0011011",
  3: "0100001",
  4: "0011101",
  5: "0111001",
  6: "0000101",
  7: "0010001",
  8: "0001001",
  9: "0010111",
};

const CODIGOS_R = {
  0: "1110010",
  1: "1100110",
  2: "1101100",
  3: "1000010",
  4: "1011100",
  5: "1001110",
  6: "1010000",
  7: "1000100",
  8: "1001000",
  9: "1110100",
};

const PARIDADES = {
  0: "LLLLLL",
  1: "LLGLGG",
  2: "LLGGLG",
  3: "LLGGGL",
  4: "LGLLGG",
  5: "LGGLLG",
  6: "LGGGLL",
  7: "LGLGLG",
  8: "LGLGGL",
  9: "LGGLGL",
};

function montarBarras(codigo) {
  if (!/^\d{13}$/.test(String(codigo || ""))) return null;

  const digitos = String(codigo).split("").map(Number);
  const paridade = PARIDADES[digitos[0]];
  let barras = "101";

  for (let index = 1; index <= 6; index += 1) {
    barras += paridade[index - 1] === "L" ? CODIGOS_L[digitos[index]] : CODIGOS_G[digitos[index]];
  }

  barras += "01010";
  for (let index = 7; index <= 12; index += 1) barras += CODIGOS_R[digitos[index]];
  return barras + "101";
}

export default function Ean13Barcode({ codigo, className = "" }) {
  const barras = montarBarras(codigo);
  if (!barras) return <span className={className}>Código indisponível</span>;

  return (
    <svg
      viewBox="0 0 113 56"
      role="img"
      aria-label={`Código de barras ${codigo}`}
      className={className}
      preserveAspectRatio="none"
    >
      <rect width="113" height="56" fill="#fff" />
      {barras.split("").map((barra, index) => {
        if (barra !== "1") return null;
        const guarda = index < 3 || (index >= 45 && index < 50) || index >= 92;
        return (
          <rect
            key={index}
            x={index + 9}
            y="1"
            width="1"
            height={guarda ? 47 : 42}
            fill="#0B1115"
          />
        );
      })}
    </svg>
  );
}
