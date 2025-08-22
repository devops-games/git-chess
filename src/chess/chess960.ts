#!/usr/bin/env node

function generateChess960Position(): string {
  const backRank: string[] = new Array(8).fill('');
  
  const position = Math.floor(Math.random() * 960);
  
  const n2n = (position % 6) * 2 + 1;
  const n1 = Math.floor(position / 6) % 6;
  const n1n = n1 + (n1 >= Math.floor(n2n / 2) ? 1 : 0);
  const q = Math.floor(position / 36) % 6;
  
  const availableLight: number[] = [];
  const availableDark: number[] = [];
  for (let i = 0; i < 8; i++) {
    if (i % 2 === 0) availableDark.push(i);
    else availableLight.push(i);
  }
  
  const bishopDark = availableDark[Math.floor(Math.random() * 4)];
  const bishopLight = availableLight[Math.floor(Math.random() * 4)];
  backRank[bishopDark] = 'b';
  backRank[bishopLight] = 'b';
  
  const remaining: number[] = [];
  for (let i = 0; i < 8; i++) {
    if (backRank[i] === '') remaining.push(i);
  }
  
  const queenPos = remaining[q % remaining.length];
  backRank[queenPos] = 'q';
  remaining.splice(remaining.indexOf(queenPos), 1);
  
  const knight1Pos = remaining[n1n % remaining.length];
  backRank[knight1Pos] = 'n';
  remaining.splice(remaining.indexOf(knight1Pos), 1);
  
  const knight2Pos = remaining[Math.floor(n2n / 2) % remaining.length];
  backRank[knight2Pos] = 'n';
  remaining.splice(remaining.indexOf(knight2Pos), 1);
  
  backRank[remaining[0]] = 'r';
  backRank[remaining[1]] = 'k';
  backRank[remaining[2]] = 'r';
  
  const whiteRank = backRank.map(p => p.toUpperCase()).join('');
  const blackRank = backRank.join('');
  
  const fen = `${blackRank}/pppppppp/8/8/8/8/PPPPPPPP/${whiteRank} w KQkq - 0 1`;
  
  return fen;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(generateChess960Position());
}

export { generateChess960Position };