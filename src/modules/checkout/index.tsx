import { notFound } from 'next/navigation';
import { cache } from 'react';
import Footer from '@/components/Footer';

import {
  getCourseBySlug,
  getCourseLessons,
  getUserEnrollmentStatus,
} from './actions/checkout.actions';

import CourseCurriculum from './components/CourseCurriculum';
import CourseDetails from './components/CourseDetails';
import CourseHeader from './components/CourseHeader';
import CourseIncludes from './components/CourseIncludes';
import CourseVideo from './components/CourseVideo';
import PurchaseCard from './components/PurchaseCard';

interface CheckoutProps {
  courseId: string;
}

/**
 * Cacheamos el curso por slug
 * Evita doble fetch si luego usas generateMetadata
 */
const getCachedCourse = cache(async (slug: string) => {
  return await getCourseBySlug(slug);
});

export default async function Checkout({ courseId }: CheckoutProps) {
  if (!courseId) notFound();

  const { course, error } = await getCachedCourse(courseId);

  if (error || !course) {
    notFound();
  }

  // Paralelizamos lo que depende del course.id
  const [{ lessons }, isEnrolled] = await Promise.all([
    getCourseLessons(course.id),
    getUserEnrollmentStatus(course.id),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <CourseHeader />

      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <CourseVideo
              courseId={course.id}
              courseTitle={course.title}
              coursePrice={course.price}
              muxPlaybackId={course.mux_playback_id ?? ''}
              initialEnrolled={isEnrolled}
            />

            <CourseDetails course={course} lessons={lessons} />

            <CourseIncludes
              lessonsCount={lessons.length}
              duration={course.duration}
            />
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20 space-y-4">
              <PurchaseCard
                courseId={course.id}
                courseTitle={course.title}
                originalPrice={course.price}
                discountPercentage={course.discount_percentage}
                isInitialEnrolled={isEnrolled}
              />

              <CourseCurriculum lessons={lessons} />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
