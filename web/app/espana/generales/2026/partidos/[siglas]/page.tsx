import PartidoPage, {
  generateMetadata as genMeta,
  generateStaticParams as genParams,
} from '@/app/partidos/[siglas]/page';

export const dynamicParams = false;
export const generateStaticParams = genParams;
export const generateMetadata = genMeta;
export default PartidoPage;
