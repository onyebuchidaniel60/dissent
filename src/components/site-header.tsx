"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { BrandMark, Wordmark } from "@/components/brand";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { NAV_ITEMS, OPERATOR_NAV_ITEMS, SITE } from "@/lib/site";
import { cn } from "@/lib/cn";

function isActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="page-width">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label={`${SITE.name} home`}>
            <BrandMark />
            <Wordmark />
          </Link>

          <nav className="main-nav" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link"
                data-active={isActive(pathname, item.href)}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/operator"
              className={cn("nav-link", pathname.startsWith("/operator") && "text-ink")}
              data-active={pathname.startsWith("/operator")}
              aria-current={pathname.startsWith("/operator") ? "page" : undefined}
            >
              Operator
            </Link>
          </nav>

          <div className="header-actions">
            <WalletConnectButton className="button button--primary button--small" />
            <button
              type="button"
              className="mobile-menu-button"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((current) => !current)}
            >
              {menuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <nav
          id="mobile-navigation"
          className="mobile-nav"
          data-open={menuOpen}
          aria-label="Mobile navigation"
        >
          {[...NAV_ITEMS, ...OPERATOR_NAV_ITEMS].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-4">
            <WalletConnectButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
