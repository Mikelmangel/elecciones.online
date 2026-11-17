import PageVotacion, {
  generateMetadata as genMeta,
  generateStaticParams as genParams,
} from '@/app/votaciones/[id]/page';

export const dynamicParams = true;
export const generateStaticParams = genParams;
export const generateMetadata = genMeta;
export default PageVotacion;
