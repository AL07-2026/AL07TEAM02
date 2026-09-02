import chokLogo from '@/assets/chok-logo.png';

export function ChokBrand({ href = '/' }: { href?: string }) {
  return (
    <a className="brand" href={href} aria-label="촉 홈">
      <span className="brand-logo-frame">
        <img className="brand-logo" src={chokLogo} alt="촉 CHOK" />
      </span>
    </a>
  );
}
