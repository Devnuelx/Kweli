// This layout wraps all pages under the (public) route group, 
// ensuring they do NOT contain any session check logic.
// This file can use "use client" or be a server component. We'll use a server component.

export default function PublicLayout({ children }) {
    // NO session or router checks here.
    // This layout is purely structural for public marketing pages.
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }
  