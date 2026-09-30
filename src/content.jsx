import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { initialContent } from "./siteData";

const ContentContext = createContext({
  ...initialContent,
  ready: true,
  offline: false,
  refresh: () => {},
});

export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "same-origin",
  });

  const contentType = response.headers.get("content-type") || "";
  let data;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    throw new Error("Server returned non-JSON response");
  }

  if (!response.ok) {
    const error = new Error(data?.error || "Request failed.");
    error.status = response.status;
    throw error;
  }

  return data;
}

export function ContentProvider({ children }) {
  const [content, setContent] = useState(initialContent);
  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api("/content");
      // Only overwrite initialContent if the returned data is an actual valid content object
      if (data && (data.settings || data.courses)) {
        setContent(data);
        setOffline(false);
      } else {
        setOffline(true);
      }
    } catch {
      // Fallback cleanly to initialContent if /api/content fails
      setOffline(true);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ContentContext.Provider
      value={{
        settings: content?.settings || initialContent?.settings || {},
        courses: content?.courses || initialContent?.courses || [],
        testimonials: content?.testimonials || initialContent?.testimonials || [],
        ...content,
        ready,
        offline,
        refresh,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}

export const useContent = () => {
  const context = useContext(ContentContext);
  return context || initialContent;
};

export function SocialLinks() {
  const { settings = {} } = useContent() || {};
  const icons = {
    facebook: "facebook-f",
    instagram: "instagram",
    linkedin: "linkedin-in",
    youtube: "youtube",
  };

  return (
    <div className="footer-socials">
      {Object.entries(icons)
        .filter(([key]) => settings?.[key])
        .map(([key, icon]) => (
          <a
            key={key}
            href={settings[key]}
            aria-label={key}
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className={`fa-brands fa-${icon}`} />
          </a>
        ))}
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container sub-bar-flex">
        <p>
          © {new Date().getFullYear()} R Bukhari Creative Institute. All rights
          reserved.
        </p>
        <div className="footer-actions">
          <a href="/contact">Contact admissions</a>
          <SocialLinks />
        </div>
      </div>
    </footer>
  );
}