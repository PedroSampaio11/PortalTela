import styles from './Divider.module.css'

/** `Divider` do DS (2964:453): 1.2px em border/base/muted, ocupa a largura do container. */
export function Divider() {
  return <div className={styles.divider} role="presentation" />
}
