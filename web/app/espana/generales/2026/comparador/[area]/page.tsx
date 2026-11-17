import ComparadorAreaPage, {
  generateMetadata as genMeta,
  generateStaticParams as genParams,
} from '@/app/comparador/[area]/page';

export const dynamicParams = false;
export const generateStaticParams = genParams;
export const generateMetadata = genMeta;
export default ComparadorAreaPage;
