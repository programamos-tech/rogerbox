import type { Metadata } from 'next';
import Checkout from '@/modules/checkout';
import { getCourseBySlug } from '@/modules/checkout/actions/checkout.actions';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const courseId = resolvedParams.id;
  const { course } = await getCourseBySlug(courseId);

  if (!course) {
    return {
      title: 'Course Not Found',
    };
  }

  return {
    title: `${course.title} | Checkout`,
    description: course.short_description || course.description,
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <Checkout courseId={resolvedParams.id} />;
}
