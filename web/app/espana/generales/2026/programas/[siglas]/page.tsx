import ProgramaSiglasPage, {
  generateMetadata as genMeta,
  generateStaticParams as genParams,
} from '@/app/programas/[siglas]/page';

export const dynamicParams = false;
export const generateStaticParams = genParams;
export const generateMetadata = genMeta;
export default ProgramaSiglasPage;
