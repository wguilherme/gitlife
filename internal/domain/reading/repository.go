package reading

type Repository interface {
	FindAll() ([]*Item, error)
	FindByID(id ItemID) (*Item, error)
	FindByStatus(status Status) ([]*Item, error)
	FindByTag(tag Tag) ([]*Item, error)
	Save(item *Item) error
	Update(item *Item) error
	Delete(id ItemID) error
}

type QueryOptions struct {
	Status   *Status
	Tags     []Tag
	Priority *Priority
	Type     *ItemType
	Limit    int
	Offset   int
}

type QueryRepository interface {
	Repository
	Find(options QueryOptions) ([]*Item, error)
	Count(options QueryOptions) (int, error)
}
