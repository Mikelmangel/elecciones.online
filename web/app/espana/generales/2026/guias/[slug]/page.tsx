import GuiaPage, {
  generateMetadata as genMeta,
  generateStaticParams as genParams,
} from '@/app/guias/[slug]/page';

export const dynamicParams = false;
export const generateStaticParams = genParams;
export const generateMetadata = genMeta;
export default GuiaPage;
