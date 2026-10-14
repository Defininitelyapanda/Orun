import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/navigation/app-shell";

export const metadata: Metadata = {
  title: "Privacy Policy | ORUN",
  description: "How ORUN collects, uses, stores, shares, and protects personal data.",
};

const contents = [
  ["introduction", "Introduction"],
  ["information-we-collect", "Information we collect"],
  ["how-we-use-information", "How we use your information"],
  ["legal-basis", "Legal basis for processing"],
  ["cookies", "Cookies and similar technologies"],
  ["recommendations", "Recommendations and personalisation"],
  ["public-content", "Public content and user contributions"],
  ["sharing", "Sharing and disclosure"],
  ["international-transfers", "International data transfers"],
  ["security", "Data security"],
  ["retention", "Data retention"],
  ["your-rights", "Your data-protection rights"],
  ["account-deletion", "Account deletion"],
  ["children", "Children's privacy"],
  ["third-parties", "Third-party services and external links"],
  ["experimental-features", "Experimental features"],
  ["policy-changes", "Changes to this policy"],
  ["complaints", "Complaints and contact"],
  ["governing-law", "Governing law"],
] as const;

function Section({ id, number, title, children }: { id: string; number: number; title: string; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-28 border-t border-white/10 pt-10 first:border-0 first:pt-0"><p className="eyebrow">Section {number}</p><h2 className="mt-2 font-display text-3xl text-white md:text-4xl">{title}</h2><div className="mt-5 space-y-5 text-base leading-8 text-white/65">{children}</div></section>;
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-3"><h3 className="text-lg font-semibold text-white">{title}</h3>{children}</div>;
}

function List({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-2 pl-6 marker:text-[#ff6a3d]">{children}</ul>;
}

export default function PrivacyPage() {
  return (
    <AppShell>
      <article className="mx-auto max-w-6xl">
        <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,106,61,.16),rgba(255,255,255,.035)_55%)] p-6 md:p-10">
          <div className="flex flex-wrap items-center gap-3"><p className="eyebrow">Legal · Privacy</p><span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">Contact details pending confirmation</span></div>
          <h1 className="mt-4 max-w-4xl font-display text-5xl text-white md:text-7xl">Privacy Policy</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/65">This policy explains how ORUN collects, uses, stores, discloses, and protects personal data across its film and streaming services.</p>
          <dl className="mt-8 grid gap-4 border-t border-white/10 pt-6 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="text-white/40">Effective date</dt><dd className="mt-1 font-semibold text-white">15 October 2026</dd></div>
            <div><dt className="text-white/40">Last updated</dt><dd className="mt-1 font-semibold text-white">15 October 2026</dd></div>
            <div><dt className="text-white/40">Platform</dt><dd className="mt-1 font-semibold text-white">ORUN</dd></div>
            <div><dt className="text-white/40">Data controller</dt><dd className="mt-1 font-semibold text-white">Orun</dd></div>
          </dl>
        </header>

        <div className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] p-5 text-sm leading-7 text-amber-50/80"><p className="font-semibold text-amber-100">Pre-launch implementation notice</p><p className="mt-1">ORUN&apos;s privacy email, registered business address, and final official domain must still be confirmed. Automated account deletion and some privacy controls may not yet be operational; unavailable controls are identified in <Link href="/settings" className="font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">Settings</Link>. Do not send sensitive information until an official privacy contact is published.</p></div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start"><p className="text-sm font-semibold text-white">On this page</p><nav aria-label="Privacy policy contents" className="mt-4 max-h-[70vh] overflow-y-auto border-l border-white/10 pl-4"><ol className="space-y-2 text-sm leading-6 text-white/45">{contents.map(([id, title], index) => <li key={id}><a className="transition-colors hover:text-white" href={`#${id}`}>{index + 1}. {title}</a></li>)}</ol></nav></aside>

          <div className="space-y-12">
            <Section id="introduction" number={1} title="Introduction">
              <p>ORUN (“we”, “our”, or “us”) is a film and streaming platform designed to connect audiences with films, series, documentaries, and other audiovisual content, including African cinema.</p>
              <p>We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, disclose, and protect personal data when you access our website, applications, streaming services, account settings, and related features.</p>
              <p>This policy is intended to align with the Constitution of Kenya, 2010, including Article 31 on the right to privacy; the Data Protection Act, 2019; the applicable Data Protection Regulations; and other applicable laws.</p>
              <p>By using ORUN, you acknowledge that you have been given access to this policy. Where consent is legally required for a particular activity, we will request that consent separately. Using ORUN does not automatically constitute consent to every type of data processing.</p>
            </Section>

            <Section id="information-we-collect" number={2} title="Information we collect">
              <p>We collect only the information reasonably necessary for specified, legitimate purposes.</p>
              <Subsection title="2.1 Information you provide"><p>Depending on the features you use, we may collect:</p><List>
                <li><strong className="text-white">Account information:</strong> name or display name, email address, username, and authentication details.</li><li><strong className="text-white">Profile information:</strong> profile names, avatars, language preferences, preferred genres, and other viewing preferences.</li><li><strong className="text-white">Communications:</strong> messages sent to our support team, feedback, complaints, and correspondence.</li><li><strong className="text-white">Public contributions:</strong> comments, ratings, reviews, and other material you choose to publish on ORUN.</li><li><strong className="text-white">Transaction information:</strong> subscription selections, purchases, rentals, invoices, transaction references, and payment status.</li><li><strong className="text-white">Privacy choices:</strong> consent records, notification preferences, and account-data requests.</li><li><strong className="text-white">Content submissions:</strong> films, artwork, descriptions, subtitles, or other materials submitted by filmmakers or authorised contributors, where applicable.</li>
              </List><p>We do not intentionally request information about your private life unless it is necessary for a specified purpose and a valid legal basis exists.</p></Subsection>
              <Subsection title="2.2 Information collected during use"><p>When you use ORUN, we may collect:</p><List><li>Films or episodes watched, playback progress, and watch history.</li><li>Search queries, watchlist activity, ratings, and interactions with recommendations.</li><li>Playback quality, buffering events, device type, browser type, and application version.</li><li>IP address, approximate location derived from network information, and relevant security events.</li><li>Login timestamps, active sessions, and device identifiers where technically necessary.</li><li>Error reports and technical diagnostic information.</li></List><p>We use this information to provide streaming services, maintain account security, troubleshoot technical problems, and improve the platform where a valid legal basis permits us to do so.</p><p>We will not collect precise location data unless a specific feature requires it, the collection is lawful, and appropriate notice and permissions are provided.</p></Subsection>
              <Subsection title="2.3 Payment information"><p>Payments may be processed through external payment providers, including mobile-money services and card-payment providers supported by ORUN.</p><p>We may receive transaction references, payment status, amount, currency, provider identifiers, and limited payment-method details.</p><p>ORUN will not intentionally store raw card security codes or full card credentials in its own database. Payment providers may process payment information under their own applicable privacy and security obligations.</p></Subsection>
              <Subsection title="2.4 Information from third parties"><p>Where necessary and lawful, we may receive information from:</p><List><li>Payment and transaction providers.</li><li>Email, authentication, and security service providers.</li><li>Hosting, storage, streaming, and content-delivery providers.</li><li>Analytics and diagnostics providers, where enabled.</li><li>Filmmakers, distributors, or authorised content partners.</li><li>Public sources or integrations used to maintain film metadata.</li></List><p>We will use such information only for appropriate purposes and subject to applicable legal requirements.</p></Subsection>
            </Section>

            <Section id="how-we-use-information" number={3} title="How we use your information">
              <p>ORUN may process personal data for the following purposes:</p>
              <Subsection title="Providing the service"><List><li>Creating and managing accounts.</li><li>Authenticating users and maintaining profiles.</li><li>Streaming films and series.</li><li>Saving watch progress and managing watchlists.</li><li>Providing subscriptions, rentals, purchases, and account support.</li></List></Subsection>
              <Subsection title="Personalisation"><List><li>Recommending films and series.</li><li>Remembering preferred languages and playback settings.</li><li>Organising relevant collections and discovery features.</li><li>Improving recommendations where the applicable legal basis permits.</li></List></Subsection>
              <Subsection title="Payments and subscriptions"><List><li>Processing payments through authorised providers.</li><li>Activating, renewing, or cancelling subscriptions as applicable.</li><li>Managing rentals, purchases, refunds, and transaction records.</li><li>Preventing and investigating payment fraud.</li></List></Subsection>
              <Subsection title="Safety and security"><List><li>Detecting suspicious access and unauthorised account use.</li><li>Enforcing legitimate account and content-access rules.</li><li>Preventing spam, abuse, and fraudulent activity.</li><li>Maintaining the security and integrity of ORUN.</li></List></Subsection>
              <Subsection title="Communications"><List><li>Sending account-related notices, receipts, security alerts, and service updates.</li><li>Sending optional promotional messages where legally permitted.</li><li>Responding to support requests and privacy complaints.</li></List></Subsection>
              <Subsection title="Platform improvement"><List><li>Measuring performance and reliability.</li><li>Diagnosing errors and playback failures.</li><li>Understanding aggregate viewing trends.</li><li>Developing and testing platform features.</li></List></Subsection>
              <p>We will not use personal data for purposes incompatible with those for which it was collected without an appropriate legal basis and any notice or consent required by law.</p>
            </Section>

            <Section id="legal-basis" number={4} title="Legal basis for processing">
              <p>ORUN will identify an appropriate legal basis for each relevant processing activity, as required by Kenyan law.</p><p>Depending on the circumstances, this may include:</p><List><li><strong className="text-white">Contract:</strong> processing necessary to provide a service you request, manage your account, or fulfil a transaction.</li><li><strong className="text-white">Legal obligation:</strong> processing necessary to comply with applicable laws.</li><li><strong className="text-white">Consent:</strong> processing that requires your freely given, informed, specific, and appropriately recorded consent.</li><li><strong className="text-white">Legitimate interests:</strong> processing necessary for a legitimate interest, where legally available and subject to the rights and interests of affected individuals.</li><li><strong className="text-white">Other lawful grounds:</strong> any additional basis recognised under applicable law.</li></List><p>Where we rely on consent, you may withdraw it through the relevant settings or by contacting us. Withdrawal does not invalidate processing lawfully carried out before the withdrawal, and it does not prevent processing that has another valid legal basis.</p><p>We will explain optional data uses in clear language and will not make consent to unrelated optional processing a condition of using a service when the law does not permit us to do so.</p>
            </Section>

            <Section id="cookies" number={5} title="Cookies and similar technologies">
              <p>ORUN may use cookies, local storage, and similar technologies to support its website and applications.</p><p>These technologies may be used for:</p><List><li>Authentication and session management.</li><li>Security and fraud prevention.</li><li>Remembering preferences.</li><li>Understanding platform performance.</li><li>Optional analytics or advertising, if these features are implemented.</li></List><p>Where consent is required, non-essential cookies and similar technologies will remain disabled until the user makes the appropriate choice.</p><p>You may be offered options to accept all, reject optional technologies, or customise your choices. Essential technologies necessary for security and core functionality may continue to operate.</p><p>You can also manage cookies through your browser, although disabling essential cookies may affect some ORUN features.</p><p>Our actual use of cookies will be described in a separate Cookie Notice where appropriate.</p>
            </Section>

            <Section id="recommendations" number={6} title="Recommendations and personalisation">
              <p>ORUN may use viewing activity, watchlists, ratings, preferred languages, and selected genres to recommend content.</p><p>You may be able to manage these features through your account settings, including disabling optional personalisation, clearing eligible viewing history, or resetting recommendation preferences.</p><p>Where personalisation is disabled, we may provide non-personalised recommendations based on general popularity, editorial selections, or other permitted signals.</p><p>We will not represent a recommendation as an independent editorial choice if it is materially personalised by automated processing without appropriate transparency.</p><p>We will assess whether any automated processing creates legal or similarly significant effects that trigger additional obligations under applicable law.</p>
            </Section>

            <Section id="public-content" number={7} title="Public content and user contributions">
              <p>ORUN may allow users to post reviews, ratings, comments, or other contributions.</p><p>Material you choose to publish may be visible to other users and may be associated with your display name or profile, depending on the feature&apos;s design and your settings.</p><p>Do not publish personal information about yourself or another person that you do not wish to make public.</p><p>Your private viewing history, account email, payment details, and private watchlist will not be publicly displayed merely because you participate in reviews or comments.</p><p>We may moderate or remove contributions in accordance with our platform rules, applicable law, and legitimate safety requirements.</p><p>If a public contribution remains visible after an account is deleted, we will handle it according to the applicable deletion process, platform functionality, and legal obligations. Where appropriate, we may remove or anonymise the association with your account.</p>
            </Section>

            <Section id="sharing" number={8} title="Sharing and disclosure of personal data">
              <p>ORUN does not sell personal data to advertisers.</p><p>We may disclose relevant personal data to the following categories of recipients when necessary and lawful:</p><List><li>Hosting, database, storage, and content-delivery providers.</li><li>Payment and mobile-money providers.</li><li>Authentication and account-security providers.</li><li>Email, customer-support, and notification providers.</li><li>Analytics and technical-diagnostics providers where enabled.</li><li>Authorised filmmakers, distributors, or business partners when necessary for an expressly described service.</li><li>Professional advisers, auditors, or insurers where appropriate.</li><li>Regulators, law-enforcement authorities, or courts when legally required or otherwise lawfully justified.</li></List><p>Service providers should receive only the information reasonably necessary to perform their assigned functions and must be subject to appropriate contractual and security safeguards.</p><p>We do not authorise third parties to use ORUN account data for unrelated purposes merely because they provide services to us.</p><p>If ORUN undergoes a merger, restructuring, or transfer of business, personal data may be handled as part of that transaction subject to applicable law, appropriate safeguards, and any required notice.</p>
            </Section>

            <Section id="international-transfers" number={9} title="International data transfers">
              <p>Some of ORUN&apos;s service providers may process information outside Kenya.</p><p>Where personal data is transferred outside Kenya, ORUN will comply with the applicable requirements of Kenyan data-protection law, including any applicable conditions concerning safeguards, adequacy, consent, or other lawful transfer mechanisms.</p><p>We will take reasonable steps to ensure that international recipients protect personal data appropriately.</p><p>Where required, we will provide information about relevant transfer arrangements and safeguards.</p>
            </Section>

            <Section id="security" number={10} title="Data security">
              <p>ORUN will implement appropriate technical and organisational safeguards to protect personal data against unauthorised access, disclosure, alteration, loss, or destruction.</p><p>Depending on the system and the risk involved, safeguards may include:</p><List><li>Encryption in transit and appropriate encryption at rest.</li><li>Secure password hashing and authentication controls.</li><li>Role-based access restrictions.</li><li>Session management and account-security monitoring.</li><li>Validation of user input and protection against common application attacks.</li><li>Secure backups and recovery procedures.</li><li>Audit logging and monitoring.</li><li>Security testing and controlled access to production systems.</li></List><p>No internet service can guarantee absolute security. If a personal-data breach occurs, ORUN will assess the incident and notify affected persons and relevant authorities where and when required by law.</p>
            </Section>

            <Section id="retention" number={11} title="Data retention">
              <p>ORUN will retain personal data only for as long as reasonably necessary for the purpose for which it was collected, unless a longer period is required or permitted by law.</p><p>Retention periods may depend on the type of information and the circumstances:</p><List><li><strong className="text-white">Account data:</strong> while the account remains active and for an appropriate period afterwards.</li><li><strong className="text-white">Viewing history and preferences:</strong> until deleted, reset, or no longer needed for the relevant purpose, subject to applicable exceptions.</li><li><strong className="text-white">Payment and transaction records:</strong> for the period required by applicable financial, tax, accounting, and legal obligations.</li><li><strong className="text-white">Security logs:</strong> for a documented period proportionate to security and operational needs.</li><li><strong className="text-white">Support correspondence:</strong> for the period needed to resolve the matter and meet legitimate recordkeeping requirements.</li><li><strong className="text-white">Consent records:</strong> for the period necessary to demonstrate compliance.</li><li><strong className="text-white">Export files:</strong> for a limited period after they become available for download.</li></List><p>ORUN will establish and periodically review specific retention schedules. Data that is no longer needed will be securely deleted, anonymised, or otherwise handled in accordance with applicable law.</p>
            </Section>

            <Section id="your-rights" number={12} title="Your data-protection rights">
              <p>Subject to applicable law and any lawful limitations, you may have the right to:</p><List><li>Be informed about how your personal data is used.</li><li>Access personal data held about you.</li><li>Request correction of inaccurate or misleading information.</li><li>Request deletion of personal data where the legal conditions are met.</li><li>Object to certain processing activities.</li><li>Request restriction of processing where applicable.</li><li>Withdraw consent where processing relies on consent.</li><li>Request information about applicable automated decision-making.</li><li>Exercise applicable rights relating to data portability.</li><li>Lodge a complaint with the Office of the Data Protection Commissioner in Kenya.</li></List><p>These rights are not absolute in every circumstance. For example, ORUN may need to retain certain transaction records to comply with legal obligations or preserve information relevant to a legal claim.</p><Subsection title="How to make a request"><div className="rounded-xl border border-white/10 bg-white/[0.03] p-5"><p><strong className="text-white">Privacy contact:</strong> To be confirmed before launch</p></div><p>Please describe the request and identify the account concerned. We may request reasonable verification to protect your information and prevent unauthorised access.</p><p>We will handle requests in accordance with applicable legal procedures and deadlines. If a request cannot be fulfilled fully, we will explain the reason where legally required.</p></Subsection>
            </Section>

            <Section id="account-deletion" number={13} title="Account deletion">
              <p>You may request deletion of your ORUN account through the account settings or by contacting our privacy team once those channels are operational.</p><p>After verifying the request, ORUN will process the deletion in accordance with applicable law and its documented deletion procedures.</p><p>Depending on the circumstances, deletion may include:</p><List><li>Removing or anonymising account and profile information.</li><li>Deleting eligible viewing history and preferences.</li><li>Removing eligible personal data from active systems.</li><li>Revoking active sessions and access credentials.</li><li>Handling reviews and comments according to the applicable deletion process.</li><li>Deleting eligible export files and optional personalisation data.</li></List><p>Some records may need to be retained where required by law or necessary for the establishment, exercise, or defence of legal claims. Where appropriate, retained records will be restricted to the relevant purpose.</p><p>Deleting an account may result in the loss of access to its profiles, watchlists, subscription benefits, and other associated services. Any applicable refund rights will be determined under the relevant terms and law.</p>
            </Section>

            <Section id="children" number={14} title="Children's privacy">
              <p>ORUN will implement age-appropriate safeguards for children and young users, consistent with applicable Kenyan law.</p><p>Where a feature is intended for children or processes children&apos;s personal data, ORUN will apply the required protections, including appropriate parental or guardian involvement where legally required.</p><p>We will not knowingly collect children&apos;s personal data beyond what is permitted and necessary for a lawful purpose. We will apply appropriate safeguards to age-related information, profile restrictions, and content access.</p><p>Parents or guardians who believe a child&apos;s personal data has been collected or used unlawfully may contact our privacy team.</p>
            </Section>

            <Section id="third-parties" number={15} title="Third-party services and external links">
              <p>ORUN may contain links to external websites or integrate with third-party services.</p><p>Those services may operate under their own privacy policies and terms. ORUN is not responsible for the independent privacy practices of third parties outside its control.</p><p>We encourage users to review the relevant third-party policies before providing information directly to those services.</p><p>Where ORUN engages a service provider to process personal data on its behalf, we will take appropriate steps to govern that processing under applicable law.</p>
            </Section>

            <Section id="experimental-features" number={16} title="Experimental features">
              <p>ORUN may offer experimental features, including alternative video-delivery technologies, new recommendation methods, or diagnostic tools.</p><p>Such features will be subject to appropriate privacy and security review before deployment.</p><p>Where an experimental feature involves additional personal-data processing, network exposure, optional analytics, or peer-to-peer connections, ORUN will provide appropriate information and obtain consent where required.</p><p>We will not silently enable optional peer uploading or knowingly disclose users&apos; personal files through an experimental streaming feature.</p><p>Experimental features may be disabled, changed, or withdrawn as development progresses.</p>
            </Section>

            <Section id="policy-changes" number={17} title="Changes to this privacy policy">
              <p>ORUN may update this policy to reflect changes in its services, technology, business arrangements, or legal obligations.</p><p>The latest version will be published on the ORUN website with an updated effective date.</p><p>Where a change is material or the law requires additional notice or consent, ORUN will provide appropriate notification and seek consent where required.</p><p>Continued use of ORUN will not be treated as consent to a new processing activity where the law requires separate consent.</p>
            </Section>

            <Section id="complaints" number={18} title="Complaints and contact">
              <p>For privacy questions, requests, or complaints, contact:</p><div className="rounded-xl border border-white/10 bg-white/[0.03] p-5"><p className="font-semibold text-white">ORUN Privacy Team</p><p><strong className="text-white">Email:</strong> To be confirmed before launch</p><p><strong className="text-white">Postal address:</strong> 02200, Nairobi, Kenya — registered business address to be confirmed</p><p><strong className="text-white">Website:</strong> Orun.stream — official domain to be confirmed</p></div><p>You may also contact the <strong className="text-white">Office of the Data Protection Commissioner (ODPC), Kenya</strong>, through its official website: <a className="font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white" href="https://www.odpc.go.ke/" target="_blank" rel="noreferrer">odpc.go.ke</a>.</p><p>ORUN will investigate privacy complaints and respond in accordance with applicable law.</p>
            </Section>

            <Section id="governing-law" number={19} title="Governing law">
              <p>This Privacy Policy is intended to be interpreted consistently with the Constitution of Kenya, 2010; the Data Protection Act, 2019; applicable regulations; and other relevant laws of Kenya.</p><p>Nothing in this policy is intended to remove or unlawfully restrict any right available to an individual under applicable law.</p>
            </Section>

            <div className="rounded-2xl border border-[#ff6a3d]/25 bg-[#ff6a3d]/10 p-6 text-sm leading-7 text-white/70"><p className="font-semibold text-white">Important notice</p><p className="mt-2">This policy must be reviewed against ORUN&apos;s actual technical systems, legal entity, data flows, service providers, and retention practices before final publication. All pending contact details must be confirmed, together with any required registrations, notices, consent mechanisms, and other compliance obligations, by a qualified Kenyan data-protection professional.</p></div>
          </div>
        </div>
      </article>
    </AppShell>
  );
}
