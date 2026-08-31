import { TAG_GROUPS, tagsInGroup } from '../../lib/giftTags';
import { pluralize } from '../../lib/format';

export interface TagPickerProps {
  value: string[];
  onChange: (next: string[]) => void;
}

/**
 * Grouped toggles for the gift-finder facets.
 *
 * Whatever is ticked here is what shoppers can browse by on the storefront — an untagged
 * product is still on sale and still searchable, it just will not surface under "Diwali" or
 * "For her".
 */
export function TagPicker({ value, onChange }: TagPickerProps) {
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((entry) => entry !== id) : [...value, id]);
  };

  return (
    <div className="tag-picker">
      {TAG_GROUPS.map((group) => (
        <fieldset key={group.id} className="tag-group">
          <legend className="tag-group-legend">{group.label}</legend>
          <div className="tag-group-chips">
            {tagsInGroup(group.id).map((tag) => {
              const checked = value.includes(tag.id);
              return (
                <label key={tag.id} className={checked ? 'tag-chip is-on' : 'tag-chip'}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggle(tag.id)}
                  />
                  {tag.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      <p className="tag-picker-summary">
        {value.length === 0
          ? 'No tags yet — this product will not appear in the gift finder.'
          : `${value.length} ${pluralize(value.length, 'tag')} selected.`}
      </p>
    </div>
  );
}
