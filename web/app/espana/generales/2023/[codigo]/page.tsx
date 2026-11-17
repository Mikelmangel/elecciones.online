import PageProvincia, {
  generateMetadata as genMeta,
  generateStaticParams as genParams,
} from '@/app/resultados-2023/[codigo]/page';

export const dynamicParams = false;
export const generateStaticParams = genParams;
export const generateMetadata = genMeta;
export default PageProvincia;
