import PartidoAreaPage, {
  generateMetadata as genMeta,
  generateStaticParams as genParams,
} from '@/app/partidos/[siglas]/[area]/page';

export const dynamicParams = false;
export const generateStaticParams = genParams;
export const generateMetadata = genMeta;
export default PartidoAreaPage;
