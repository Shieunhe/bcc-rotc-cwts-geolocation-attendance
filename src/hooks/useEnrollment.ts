import { useMutation } from "@tanstack/react-query";
import { enrollmentService } from "@/services/enrollment.service";
import { EnrollmentFormData } from "@/types/enrollmentTypes";

export function useEnrollment() {
  const mutation = useMutation({
    mutationFn: (formData: EnrollmentFormData) => 
      enrollmentService.submitEnrollment(formData),
  });

  const submitEnrollment = async (formData: EnrollmentFormData) => {
    const result = await mutation.mutateAsync(formData);
    return result;
  };

  const errorMessage = mutation.data?.success === false 
    ? mutation.data.error 
    : mutation.error instanceof Error 
      ? mutation.error.message 
      : null;

  return {
    submitEnrollment,
    isSubmitting: mutation.isPending,
    isSuccess: mutation.data?.success ?? false,
    error: errorMessage,
    clearError: mutation.reset,
  };
}
