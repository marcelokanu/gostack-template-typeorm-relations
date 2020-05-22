import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    return this.ormRepository.save({ name, price, quantity });
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const productsList = await this.ormRepository.findOne({ where: { name } });

    return productsList;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsList = await this.ormRepository.findByIds(products);

    return productsList;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsToUpdate = await this.ormRepository.save(products);

    return productsToUpdate;
  }
}

export default ProductsRepository;
