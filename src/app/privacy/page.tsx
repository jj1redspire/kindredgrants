export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-serif text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
      <div className="prose prose-gray">
        <p className="text-gray-600 leading-relaxed mb-4">
          <strong>Effective Date:</strong> January 1, 2026
        </p>
        <p className="text-gray-600 leading-relaxed mb-6">
          KindredGrants takes the privacy of your organization&apos;s data seriously. This policy explains how we collect, use, and protect your information.
        </p>
        <h2 className="font-serif text-xl font-bold text-gray-900 mt-8 mb-3">Data We Collect</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          We collect documents you upload (990s, financial statements, program descriptions), account information (email address), and usage data to improve the service.
        </p>
        <h2 className="font-serif text-xl font-bold text-gray-900 mt-8 mb-3">How We Use Your Data</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Your uploaded documents are used exclusively to generate grant narratives for your organization. Your data is never shared with other organizations or used to train AI models.
        </p>
        <h2 className="font-serif text-xl font-bold text-gray-900 mt-8 mb-3">Data Security</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          All documents are encrypted at rest and in transit. We use industry-standard security practices to protect your data.
        </p>
        <h2 className="font-serif text-xl font-bold text-gray-900 mt-8 mb-3">Contact</h2>
        <p className="text-gray-600 leading-relaxed">
          Questions about this policy? Contact us at <a href="mailto:joel@helmport.com" className="text-green-800 hover:underline">joel@helmport.com</a>.
        </p>
      </div>
    </div>
  )
}
