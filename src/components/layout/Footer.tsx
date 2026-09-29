import swasthyaConnectLogo from '../../assets/images/swasthya_connect.png'

export function Footer() {
  return (
    <footer className="bg-[#123B6D] text-white">
      <div className="mx-auto max-w-full px-2 sm:px-3 md:px-4 lg:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8 lg:gap-10 py-6 sm:py-8 md:py-10 lg:py-12">
          <div className="sm:col-span-2 lg:col-span-1 pr-0 lg:pr-6">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
              <div className="flex h-[30px] w-[30px] sm:h-[36px] sm:w-[36px] md:h-[42px] md:w-[42px] items-center justify-center rounded bg-white p-1 flex-shrink-0">
                <img src={swasthyaConnectLogo} alt="Swasthya Connect" className="h-full w-full object-contain" />
              </div>
              <div>
                <h3 className="text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] font-bold text-white">Swasthya Connect</h3>
                <p className="text-[8px] sm:text-[9px] md:text-[10px] text-blue-200">by HealthSync1 Team *ID - 165109*</p>
                <p className="hidden sm:block text-[8px] md:text-[9px] lg:text-[10px] text-blue-200">Integrated Rural Healthcare</p>
              </div>
            </div>
            <p className="mt-2 sm:mt-3 md:mt-5 text-[9px] sm:text-[10px] md:text-[11px] lg:text-[12px] text-blue-200">Prototype • Smart India Hackathon 2026</p>
          </div>

          {[
            ['About', ['Overview', 'Objectives', 'Team', 'Contact Us']],
            ['Services', ['For Patients', 'For Frontline Workers', 'For Doctors', 'For Facilities']],
            ['Resources', ['User Guide', 'Training Materials', 'Research & Reports', 'Media Gallery']],
            ['Help & Support', ['FAQs', 'Feedback', 'Report an Issue', 'Sitemap']],
          ].map(([heading, links]) => (
            <div key={heading as string}>
              <h4 className="mb-2 sm:mb-3 md:mb-4 text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] font-bold text-white">{heading}</h4>
              <ul className="space-y-1 sm:space-y-1.5 md:space-y-2 text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] text-blue-200">
                {(links as string[]).map((link) => (
                  <li key={link} className="hover:text-white transition-colors cursor-pointer">{link}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-blue-700">
          <div className="mx-auto flex flex-col sm:flex-row items-center justify-center lg:justify-between gap-2 sm:gap-3 md:gap-4 px-2 sm:px-3 md:px-4 py-3 sm:py-4 text-[9px] sm:text-[10px] md:text-[11px] lg:text-[12px] text-blue-200 text-center">
            <div>Content owned by Team - HealthSync1 Team ID- 165109 (Prototype).</div>
            <div className="hidden sm:block">Not an official Government of India website.</div>
            <div>Prototype for Smart India Hackathon 2026</div>
          </div>
        </div>
      </div>
    </footer>
  )
}
