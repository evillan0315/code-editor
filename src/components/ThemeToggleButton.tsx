import { useTheme } from '@/hooks/useTheme';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
};
export default function ThemeToggleButton(props: ToggleSwitchProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button variant="secondary" onClick={toggleTheme}>
      {theme === 'dark' ? (
        <>
          <Icon icon="mdi:brightness-3" width="2em" height="2em" />
        </>
      ) : (
        <>
          <Icon icon="mdi:brightness-5" width="2em" height="2em" />
        </>
      )}
    </Button>
  );
}
