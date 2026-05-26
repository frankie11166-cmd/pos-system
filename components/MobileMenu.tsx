"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type MobileMenuProps = {
  links: string[][];
  userName: string;
  userRole: string;
};

export function MobileMenu({ links, userName, userRole }: MobileMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="mobile-menu-button" type="button" aria-label="Open navigation" onClick={() => setOpen(true)}>
        <span />
        <span />
        <span />
      </button>
      {open && (
        <div className="mobile-menu-layer">
          <button className="mobile-menu-backdrop" type="button" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <aside className="mobile-menu-panel">
            <div className="mobile-menu-head">
              <div>
                <strong>{userName}</strong>
                <span>{userRole}</span>
              </div>
              <button className="mobile-menu-close" type="button" onClick={() => setOpen(false)} aria-label="Close navigation">
                Close
              </button>
            </div>
            <nav className="mobile-menu-links">
              {links.map(([label, href]) => (
                <Link key={href} className={pathname === href ? "active" : ""} href={href} onClick={() => setOpen(false)}>
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
