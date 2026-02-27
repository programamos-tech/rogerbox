import SimpleLoading from '@/components/SimpleLoading';

export default function LoadingPage() {
  return (
    <SimpleLoading
      message="Cada repetición te acerca a tu meta"
      showProgress={true}
    />
  );
}
