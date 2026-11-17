export const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const SLUG_PROVINCIA_MAP: Record<string, string> = {
  '01': 'alava',
  '02': 'albacete',
  '03': 'alicante',
  '04': 'almeria',
  '05': 'avila',
  '06': 'badajoz',
  '07': 'baleares',
  '08': 'barcelona',
  '09': 'burgos',
  '10': 'caceres',
  '11': 'cadiz',
  '12': 'castellon',
  '13': 'ciudad-real',
  '14': 'cordoba',
  '15': 'a-coruna',
  '16': 'cuenca',
  '17': 'girona',
  '18': 'granada',
  '19': 'guadalajara',
  '20': 'gipuzkoa',
  '21': 'huelva',
  '22': 'huesca',
  '23': 'jaen',
  '24': 'leon',
  '25': 'lleida',
  '26': 'la-rioja',
  '27': 'lugo',
  '28': 'madrid',
  '29': 'malaga',
  '30': 'murcia',
  '31': 'navarra',
  '32': 'ourense',
  '33': 'asturias',
  '34': 'palencia',
  '35': 'las-palmas',
  '36': 'pontevedra',
  '37': 'salamanca',
  '38': 'santa-cruz-de-tenerife',
  '39': 'cantabria',
  '40': 'segovia',
  '41': 'sevilla',
  '42': 'soria',
  '43': 'tarragona',
  '44': 'teruel',
  '45': 'toledo',
  '46': 'valencia',
  '47': 'valladolid',
  '48': 'bizkaia',
  '49': 'zamora',
  '50': 'zaragoza',
  '51': 'ceuta',
  '52': 'melilla',
};

export function slugProvincia(codigo: string, nombreFallback = ''): string {
  return SLUG_PROVINCIA_MAP[codigo] ?? slug(nombreFallback || codigo);
}
