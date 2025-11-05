import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const SecurityPolicy: React.FC = () => {
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
          <h1 className="text-4xl font-bold mb-6">Security Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Security Commitment</h2>
            <p className="mb-4">
              CentomoMD is committed to maintaining the highest standards of security to protect your sensitive medical information and personal data. We implement comprehensive security measures to safeguard data against unauthorized access, disclosure, alteration, or destruction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Data Encryption</h2>
            <p className="mb-4">
              All data transmitted between your device and our servers is encrypted using industry-standard Transport Layer Security (TLS) protocols. Data at rest is encrypted using AES-256 encryption.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Access Controls</h2>
            <p className="mb-4">We implement strict access controls, including:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Multi-factor authentication for administrative access</li>
              <li>Role-based access controls for platform features</li>
              <li>Regular review and revocation of access privileges</li>
              <li>Audit logging of all access attempts and data access</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Infrastructure Security</h2>
            <p className="mb-4">
              Our infrastructure is hosted on secure cloud platforms with:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Regular security assessments and penetration testing</li>
              <li>Network segmentation and firewall protection</li>
              <li>Intrusion detection and prevention systems</li>
              <li>Automated security monitoring and alerting</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Residency</h2>
            <p className="mb-4">
              All data is stored in data centers located in Canada (ca-central-1 region) to ensure compliance with Canadian data residency requirements and regulations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Compliance Standards</h2>
            <p className="mb-4">Our security practices are designed to meet or exceed:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Health Insurance Portability and Accountability Act (HIPAA) requirements</li>
              <li>Personal Information Protection and Electronic Documents Act (PIPEDA) standards</li>
              <li>Quebec Law 25 (Act to modernize legislative provisions respecting the protection of personal information)</li>
              <li>Industry best practices for healthcare data security</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Incident Response</h2>
            <p className="mb-4">
              We maintain an incident response plan to promptly address any security incidents. In the event of a data breach, we will notify affected users and relevant authorities as required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Regular Security Audits</h2>
            <p className="mb-4">
              We conduct regular security audits, vulnerability assessments, and compliance reviews to ensure our security measures remain effective and up-to-date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. User Responsibilities</h2>
            <p className="mb-4">You play an important role in maintaining security:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Use strong, unique passwords for your account</li>
              <li>Enable multi-factor authentication when available</li>
              <li>Keep your login credentials confidential</li>
              <li>Log out when using shared or public devices</li>
              <li>Report any suspicious activity immediately</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Third-Party Security</h2>
            <p className="mb-4">
              We carefully vet third-party service providers and ensure they meet our security standards. All third-party integrations are subject to security assessments and contractual security requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Security Updates</h2>
            <p className="mb-4">
              We regularly update our systems with security patches and improvements. We recommend keeping your devices and browsers up-to-date to benefit from the latest security enhancements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Reporting Security Issues</h2>
            <p className="mb-4">
              If you discover a security vulnerability or have concerns about our security practices, please contact us immediately through the platform's contact features. We take security issues seriously and will investigate promptly.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SecurityPolicy;

