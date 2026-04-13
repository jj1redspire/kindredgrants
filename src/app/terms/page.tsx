export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-serif text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
      <div className="prose prose-gray">
        <p className="text-gray-600 leading-relaxed mb-4">
          <strong>Effective Date:</strong> January 1, 2026
        </p>
        <p className="text-gray-600 leading-relaxed mb-6">
          By using KindredGrants, you agree to these terms of service.
        </p>
        <h2 className="font-serif text-xl font-bold text-gray-900 mt-8 mb-3">Service Description</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          KindredGrants provides AI-powered grant writing assistance based on documents you upload. You are responsible for reviewing and verifying all generated content before submission.
        </p>
        <h2 className="font-serif text-xl font-bold text-gray-900 mt-8 mb-3">Acceptable Use</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          You agree to use KindredGrants only for legitimate grant writing purposes. You are responsible for the accuracy of documents you upload and the grant applications you submit.
        </p>
        <h2 className="font-serif text-xl font-bold text-gray-900 mt-8 mb-3">Billing</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          KindredGrants Pro is billed at $49/month after a 14-day free trial. You may cancel at any time. Refunds are not provided for partial billing periods.
        </p>
        <h2 className="font-serif text-xl font-bold text-gray-900 mt-8 mb-3">Contact</h2>
        <p className="text-gray-600 leading-relaxed">
          Questions? <a href="mailto:joel@helmport.com" className="text-green-800 hover:underline">joel@helmport.com</a>
        </p>
      </div>
    </div>
  )
}
