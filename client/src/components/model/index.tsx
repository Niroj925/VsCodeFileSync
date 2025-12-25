import { useProjectContext } from "../../contexts/ProjectContext";
import ApiKeyModal from "./ApiKeyModel";

const Model: React.FC = () => {
  const { isOpenApiKeyModal, setIsOpenApiKeyModal } = useProjectContext();

  return (
    <div>
      <ApiKeyModal
        open={isOpenApiKeyModal}
        onClose={() => setIsOpenApiKeyModal(false)}
      />
    </div>
  );
};

export default Model;
