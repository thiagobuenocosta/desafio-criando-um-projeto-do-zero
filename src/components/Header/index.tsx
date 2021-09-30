import Link from 'next/Link';
import styles from './header.module.scss';

export default function Header() {
  return (
    <header className={ styles.headerContainer }>
      <Link href="/">
        <a>
          <img src="/Logo.svg" alt="logo" />
        </a>
      </Link>
    </header>
  );
}
