import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const { data } = await api.get<Food>(`foods/${routeParams.id}`);

      const loadedFood = {
        ...data,
        formattedPrice: formatValue(data.price),
      };

      const loadedExtras = loadedFood.extras.map(extra => ({
        ...extra,
        quantity: 0,
      }));

      setFood(loadedFood);
      setExtras(loadedExtras);
    }

    loadFood();
  }, [routeParams]);

  useEffect(() => {
    async function loadFavorites(): Promise<void> {
      const { data } = await api.get<Food[]>('favorites');

      const favorite = data.find(fav => fav.id === routeParams.id);

      setIsFavorite(!!favorite);
    }

    loadFavorites();
  }, [routeParams.id]);

  function handleIncrementExtra(id: number): void {
    setExtras(old =>
      old.map(extra =>
        extra.id === id
          ? {
              ...extra,
              quantity: extra.quantity + 1,
            }
          : extra,
      ),
    );
  }

  function handleDecrementExtra(id: number): void {
    setExtras(old =>
      old.map(extra =>
        extra.id === id
          ? {
              ...extra,
              quantity: extra.quantity > 0 ? extra.quantity - 1 : 0,
            }
          : extra,
      ),
    );
  }

  function handleIncrementFood(): void {
    setFoodQuantity(old => old + 1);
  }

  function handleDecrementFood(): void {
    setFoodQuantity(old => (old > 1 ? old - 1 : 1));
  }

  const toggleFavorite = useCallback(async () => {
    if (isFavorite) {
      api.delete(`favorites/${food.id}`);
    } else {
      const { extras: a, formattedPrice: b, ...foodProps } = food;
      api.post('favorites', foodProps);
    }

    setIsFavorite(old => !old);
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const foodValueTotal = food.price * foodQuantity;

    const extrasValueTotal = extras.reduce(
      (accumulator, extra) => accumulator + extra.value * extra.quantity,
      0,
    );

    const total = foodValueTotal + extrasValueTotal;

    return formatValue(total);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    const { id, ...foodProps } = food;

    await api.post('orders', {
      product_id: id,
      ...foodProps,
      extras,
    });

    navigation.reset({
      routes: [{ name: 'MainBottom', params: { screen: 'Dashboard' } }],
      index: 0,
    });
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
