export interface CandidaturaVotos {
  siglas: string;
  votos: number;
  color: string;
}

export interface ResultadoCircunscripcion {
  siglas: string;
  escanos: number;
  votos: number;
  porcentaje: number;
}

export function calcularDHondtProvincia(
  candidaturas: CandidaturaVotos[],
  escanosProvincia: number,
  votosBlanco: number = 0
): ResultadoCircunscripcion[] {
  const totalVotosCandidaturas = candidaturas.reduce((acc, c) => acc + c.votos, 0);
  const totalVotosValidos = totalVotosCandidaturas + votosBlanco;

  if (totalVotosValidos === 0 || escanosProvincia <= 0) return [];

  // 1. Filtrar candidaturas que superan la barrera legal del 3% de votos válidos
  const umbralMinimo = totalVotosValidos * 0.03;
  const candidaturasAptas = candidaturas.filter((c) => c.votos >= umbralMinimo);

  // 2. Generar tabla de cocientes (votos / 1, votos / 2, ..., votos / escanosProvincia)
  interface Cociente {
    siglas: string;
    valor: number;
    votosOriginales: number;
  }

  const cocientes: Cociente[] = [];
  for (const cand of candidaturasAptas) {
    for (let divisor = 1; divisor <= escanosProvincia; divisor++) {
      cocientes.push({
        siglas: cand.siglas,
        valor: cand.votos / divisor,
        votosOriginales: cand.votos,
      });
    }
  }

  // 3. Ordenar cocientes de mayor a menor (en caso de empate gana quien tenga más votos totales)
  cocientes.sort((a, b) => {
    if (b.valor !== a.valor) return b.valor - a.valor;
    return b.votosOriginales - a.votosOriginales;
  });

  // 4. Asignar los N mayores cocientes
  const escanosPorPartido: Record<string, number> = {};
  candidaturas.forEach((c) => (escanosPorPartido[c.siglas] = 0));

  const ganadores = cocientes.slice(0, escanosProvincia);
  for (const g of ganadores) {
    escanosPorPartido[g.siglas] = (escanosPorPartido[g.siglas] || 0) + 1;
  }

  return candidaturas.map((c) => ({
    siglas: c.siglas,
    escanos: escanosPorPartido[c.siglas] || 0,
    votos: c.votos,
    porcentaje: Number(((c.votos / totalVotosValidos) * 100).toFixed(2)),
  }));
}
