namespace Dir {
  type Info = {
    name: string;
    is_dir: boolean;
    size: number;
    modified_at: string;
  };

  type Page = {
    items: Info[];
    total: number;
    page: number;
    page_size: number;
  };
}
