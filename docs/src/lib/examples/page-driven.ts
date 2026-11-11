// The page drives the palette: a search box on the page opens it with
// what was typed, a button runs the first match with submit(), and the
// four events report what happened.
import '@appulsauce/ninja-keys';
import type {INinjaAction, NinjaKeys} from '@appulsauce/ninja-keys';

export default function setup(
  ninja: NinjaKeys,
  report: (message: string) => void,
  page: HTMLElement
): void {
  ninja.data = ['Invoices', 'Customers', 'Products', 'Reports', 'Settings'].map(
    (title): INinjaAction => ({
      id: title,
      title: `Go to ${title}`,
      keywords: title.toLowerCase(),
      handler: () => report(`Navigated to ${title}`),
    })
  );

  const input = page.querySelector<HTMLInputElement>('input[name="jump"]');
  const lucky = page.querySelector<HTMLButtonElement>('button[name="lucky"]');
  if (!input || !lucky) return;

  // Typing in the page's box hands the text over to the palette, so the
  // first key is not lost while the palette opens.
  input.addEventListener('input', () => {
    ninja.open({search: input.value});
    input.value = '';
  });

  // open({search}) then submit() runs the first match, as Enter would.
  lucky.addEventListener('click', () => {
    ninja.open({search: 'rep'});
    void ninja.submit();
  });

  ninja.addEventListener('open', () => report('event: open'));
  ninja.addEventListener('close', () => {
    report('event: close');
    input.focus();
  });
  // The events are typed: `event.detail` needs no cast.
  ninja.addEventListener('change', (event) => {
    const {search, actions} = event.detail;
    report(`event: change "${search}", ${actions.length} shown`);
  });
  ninja.addEventListener('selected', (event) => {
    const {action, search} = event.detail;
    const chosen = action ? action.id : `nothing for "${search}"`;
    report(`event: selected ${chosen}`);
  });
}
