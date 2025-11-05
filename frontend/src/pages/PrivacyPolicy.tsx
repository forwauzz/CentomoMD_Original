import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-slate max-w-none">
          <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              CentomoMD ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our medical documentation platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <p className="mb-4">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Account information (name, email address, professional credentials)</li>
              <li>Medical documentation and transcription data</li>
              <li>Usage data and platform interactions</li>
              <li>Technical information (IP address, browser type, device information)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process and store medical documentation</li>
              <li>Ensure platform security and prevent fraud</li>
              <li>Comply with legal obligations</li>
              <li>Communicate with you about your account and services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to protect your personal information, including encryption, access controls, and regular security assessments. All data is stored in compliance with applicable regulations, including HIPAA, PIPEDA, and Quebec Law 25.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
            <p className="mb-4">
              We retain your information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, comply with legal obligations, or as otherwise required by applicable law. Medical documentation may be retained for periods required by healthcare regulations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Access your personal information</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data (subject to legal requirements)</li>
              <li>Object to certain processing activities</li>
              <li>Withdraw consent where applicable</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Third-Party Services</h2>
            <p className="mb-4">
              We may use third-party service providers to assist in operating our platform. These providers are bound by confidentiality obligations and may only use your information for specified purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Compliance</h2>
            <p className="mb-4">
              Our platform complies with applicable privacy laws, including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Health Insurance Portability and Accountability Act (HIPAA)</li>
              <li>Personal Information Protection and Electronic Documents Act (PIPEDA)</li>
              <li>Quebec Law 25 (Act to modernize legislative provisions respecting the protection of personal information)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p className="mb-4">
              If you have questions about this Privacy Policy, please contact us through the platform's contact features or by email.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

