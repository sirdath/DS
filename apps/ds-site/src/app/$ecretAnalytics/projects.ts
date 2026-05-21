export interface Project {
  slug: string
  name: string
  pathPrefix: string
  url: string
  description: string
}

export const PROJECTS: Project[] = [
  {
    slug: 'megagym',
    name: 'MegaGym',
    pathPrefix: '/MegaGym-Website',
    url: 'ds2-consulting.com/MegaGym-Website',
    description: 'Fitness centre — Athens',
  },
  {
    slug: 'samioglou',
    name: 'Samioglou',
    pathPrefix: '/samioglou',
    url: 'ds2-consulting.com/samioglou',
    description: 'Client site — proxied deployment',
  },
]

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find(p => p.slug === slug)
}
