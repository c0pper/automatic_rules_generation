
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addDomain } from '@slices/domain/domainSlice';
import axios from 'axios';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';

const Generate = ({ fetchAvailableDomains }) => {
  const dispatch = useDispatch();
  const [generalDomain, setGeneralDomain] = useState('');
  const [minimumTaxElements, setMinimumTaxElements] = useState(5);
  const [distanceOperator, setDistanceOperator] = useState(8);

  const handleGenerate = async () => {
    try {
      const response = await axios.post('http://localhost:5000/generate_rules', {
        general_domain: generalDomain,
        minimum_tax_elements: minimumTaxElements,
        distance_operator: distanceOperator,
      });

      dispatch(addDomain(generalDomain));
      console.log(response.data.message);
      fetchAvailableDomains();
    } catch (error) {
      console.error(error.response?.data?.error || 'Error generating rules');
    }
  };

  const handleTaxElementsChange = (e) => {
    const inputValue = e.target.value;

    // If the input is empty or a valid number up to 70, allow it
    if (inputValue === '' || (Number(inputValue) >= 0 && Number(inputValue) <= 70)) {
      setMinimumTaxElements(inputValue);
    } else {
      console.log('Invalid input. Enter a number up to 70.');
    }
  };

  return (
    <div>
        <Label>
            General Domain:
        </Label>
        <Input
            type="text"
            placeholder="Automotive / Cloud services / Food delivery"
            value={generalDomain}
            onChange={(e) => setGeneralDomain(e.target.value)}
        />

        <Label>
            Minimum Tax Elements:
        </Label>
        <Input
          type="number"
          value={minimumTaxElements}
          onChange={handleTaxElementsChange}
        />

        <Label>
            Distance Operator:
        </Label>
        <Input
            type="number"
            value={distanceOperator}
            onChange={(e) => setDistanceOperator(parseInt(e.target.value, 10))}
        />

        <Button onClick={handleGenerate}>Generate</Button>
    </div>
  );
};

export default Generate;
