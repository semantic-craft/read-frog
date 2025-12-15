import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/base-ui/select'

const roleItems = [
  { label: 'Developer', value: 'developer' },
  { label: 'Designer', value: 'designer' },
  { label: 'Manager', value: 'manager' },
  { label: 'Other', value: 'other' },
]

export default function SelectExample() {
  return (
    <Select items={roleItems} defaultValue={null}>
      <SelectTrigger id="small-form-role">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {roleItems.map(item => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
