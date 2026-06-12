export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Submit a contact-form message.
 *
 * TODO(backend): wire this to the real contact endpoint once it exists
 * (e.g. POST /contact via apiClient). For now it simulates a successful
 * submission so the UI flow can be exercised end to end.
 */
export const submitContact = async (_message: ContactMessage): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
};
