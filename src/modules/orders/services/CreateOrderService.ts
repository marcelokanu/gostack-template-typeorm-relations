import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}
interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateProductService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer does not exists');
    }

    const checkProductQuantityReceived = products.some(
      product => product.quantity <= 0,
    );

    if (checkProductQuantityReceived) {
      throw new AppError('Quantity invalid to some products in list.');
    }

    const productsInStock = await this.productsRepository.findAllById(products);

    if (productsInStock.length !== products.length) {
      throw new AppError('One or more products not found in stock.');
    }

    const updateProducts: IProduct[] = [];

    const productsInOrder = productsInStock.map(productInStock => {
      const productInOrder = products.find(
        productOrder => productOrder.id === productInStock.id,
      );
      if (
        (productInOrder?.quantity || 0) > productInStock.quantity ||
        productInStock.quantity === 0
      ) {
        throw new AppError(
          `The product ${productInStock.name} has only ${productInStock.quantity} pieces in stock.`,
        );
      }
      updateProducts.push({
        id: productInStock.id,
        quantity: productInStock.quantity - (productInOrder?.quantity || 0),
      });
      return {
        product_id: productInStock.id,
        price: productInStock.price,
        quantity: productInOrder?.quantity || 0,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: productsInOrder,
    });

    await this.productsRepository.updateQuantity(updateProducts);

    return order;
  }
}

export default CreateProductService;
