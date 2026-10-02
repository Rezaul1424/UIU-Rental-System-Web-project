import ListingDetailPage from '../../../components/ListingDetail'
import type { Listing } from '../../../types'

type ListingDetailViewPageProps = {
  listing: Listing
  onBack: () => void
  isFavorited: boolean
  onToggleFavorite: () => void
  actions: React.ReactNode
  currentTenants?: Array<{ name: string; studentId?: string }>
}

export default function ListingDetailViewPage({ listing, onBack, isFavorited, onToggleFavorite, actions, currentTenants }: ListingDetailViewPageProps) {
  return (
    <ListingDetailPage
      listing={listing}
      onBack={onBack}
      backLabel="← Back to Browse"
      isFavorited={isFavorited}
      onToggleFavorite={onToggleFavorite}
      actions={actions}
      currentTenants={currentTenants}
    />
  )
}
