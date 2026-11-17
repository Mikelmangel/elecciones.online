import CandidaturasProvinciaPage, {
  generateMetadata as genMeta,
  generateStaticParams as genParams,
} from '@/app/candidaturas/[codigo]/page';

export const dynamicParams = false;
export const generateStaticParams = genParams;
export const generateMetadata = genMeta;
export default CandidaturasProvinciaPage;
