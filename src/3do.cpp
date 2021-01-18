#include "3do.h"
#include "file.h"

#include <deque>
#include <functional>
#include <map>
#include <ostream>
#include <tuple>
#include <vector>

using vertex_t = std::tuple<double, double, double>;
using face_t = std::vector<std::uint16_t>;

struct node_t
{
  std::string id, parent, texture;
  double x, y, z;
  std::vector<vertex_t> vertexes;
  std::vector<face_t> faces;
};

struct TA3DOFile::impl
{

  std::map<std::string, node_t> nodes;

  void parse(const std::string &input)
  {

    const auto scale = 1 / 65536.0;

    using vertex_t = std::tuple<double, double, double>;
    auto vertexes = std::vector<vertex_t>{};

    using search_t = std::tuple<std::size_t, std::string, double, double, double>;
    auto fringe = std::deque<search_t>{{0, {}, 0, 0, 0}};

    while (!fringe.empty())
    {

      auto [offset, parent, x0, y0, z0] = fringe.front();
      fringe.pop_front();

      auto hVersionSignature = read<std::uint32_t>(input, offset + 0);
      auto hNumberOfVertexes = read<std::uint32_t>(input, offset + 4);
      auto hNumberOfPrimitives = read<std::uint32_t>(input, offset + 8);
      auto hOffsetToselectionPrimitive = read<std::int32_t>(input, offset + 12);
      auto hXFromParent = read<std::int32_t>(input, offset + 16);
      auto hYFromParent = read<std::int32_t>(input, offset + 20);
      auto hZFromParent = read<std::int32_t>(input, offset + 24);
      auto hOffsetToObjectName = read<std::uint32_t>(input, offset + 28);
      auto hAlways_0 = read<std::uint32_t>(input, offset + 32);
      auto hOffsetToVertexArray = read<std::uint32_t>(input, offset + 36);
      auto hOffsetToPrimitiveArray = read<std::uint32_t>(input, offset + 40);
      auto hOffsetToSiblingObject = read<std::uint32_t>(input, offset + 44);
      auto hOffsetToChildObject = read<std::uint32_t>(input, offset + 48);

      auto hObjectName = std::string{};
      read(input, &hObjectName, hOffsetToObjectName);
      auto &node = nodes[hObjectName];
      node.id = hObjectName;
      node.parent = parent;
      node.x = hXFromParent * scale;
      node.y = hYFromParent * scale;
      node.z = hZFromParent * scale;
      // out << "o " << hObjectName << "\n";

      // out << "# t " << hXFromParent * scale << " " << hYFromParent * scale << " " << hZFromParent * scale << "\n";
      auto vOffset = vertexes.size();
      for (int i = 0; i < hNumberOfVertexes; ++i)
      {
        auto x = read<std::int32_t>(input, hOffsetToVertexArray + i * 12) * scale;
        auto y = read<std::int32_t>(input, hOffsetToVertexArray + i * 12 + 4) * scale;
        auto z = read<std::int32_t>(input, hOffsetToVertexArray + i * 12 + 8) * scale;

        // out << "v " << x << " " << y << " " << z << "\n";
        node.vertexes.emplace_back(x, y, z);
      }

      for (int i = 0; i < hNumberOfPrimitives; ++i)
      {
        if (i == hOffsetToselectionPrimitive)
          continue;
        auto hColorIndex = read<std::uint32_t>(input, hOffsetToPrimitiveArray + i * 8 * 4 + 0);
        auto hNumberOfVertexIndexes = read<std::uint32_t>(input, hOffsetToPrimitiveArray + i * 8 * 4 + 4);
        auto hAlways_0 = read<std::uint32_t>(input, hOffsetToPrimitiveArray + i * 8 * 4 + 8);
        auto hOffsetToVertexIndexArray = read<std::uint32_t>(input, hOffsetToPrimitiveArray + i * 8 * 4 + 12);
        auto hOffsetToTextureName = read<std::uint32_t>(input, hOffsetToPrimitiveArray + i * 8 * 4 + 16);
        auto hUnknown_1 = read<std::uint32_t>(input, hOffsetToPrimitiveArray + i * 8 * 4 + 20);
        auto hUnknown_2 = read<std::uint32_t>(input, hOffsetToPrimitiveArray + i * 8 * 4 + 24);
        auto hIsColored = read<std::uint32_t>(input, hOffsetToPrimitiveArray + i * 8 * 4 + 28);

        if (hOffsetToTextureName > 0)
        {
          std::string texture;
          read(input, &texture, hOffsetToTextureName);
          node.texture = texture;
          // std::cout << texture << std::endl;
        }

        if (hNumberOfVertexIndexes == 2)
          ;
        // out << "l ";
        else if (hNumberOfVertexIndexes >= 3)
          ;
        // out << "f ";
        else
          continue;

        auto face = face_t{};
        for (int j = 0; j < hNumberOfVertexIndexes; ++j)
        {
          auto id = read<std::uint16_t>(input, hOffsetToVertexIndexArray + j * 2);
          face.push_back(id);
        }
        node.faces.push_back(face);
      }

      nodes[node.id] = node;

      if (hOffsetToSiblingObject > 0)
        fringe.emplace_front(hOffsetToSiblingObject, parent, x0, y0, z0);
      if (hOffsetToChildObject > 0)
        fringe.emplace_front(hOffsetToChildObject, node.id, x0 + hXFromParent * scale, y0 + hYFromParent * scale, z0 + hZFromParent * scale);
    }
  }
};

TA3DOFile::TA3DOFile(const std::string &input)
    : _pimpl(std::make_unique<impl>())
{
  _pimpl->parse(input);
}

TA3DOFile::~TA3DOFile()
{
}

std::ostream &operator<<(std::ostream &out, const face_t &p)
{
  auto it = std::begin(p);
  out << *it;
  while (++it != std::end(p))
    out << " " << *it;
  return out;
}

std::ostream &operator<<(std::ostream &out, const std::vector<face_t> &p)
{
  auto it = std::begin(p);
  out << *it;
  while (++it != std::end(p))
    out << " " << *it;
  return out;
}

void TA3DOFile::ExportToCollada(std::ostream &out)
{

  out << "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n";
  out << "<COLLADA xmlns=\"http://www.collada.org/2005/11/COLLADASchema\" version=\"1.4.1\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">\n";
  out << "  <asset>\n";
  out << "    <contributor>\n";
  out << "      <author>totala</author>\n";
  out << "      <authoring_tool>totala</authoring_tool>\n";
  out << "    </contributor>\n";
  out << "    <created>2021-01-14T21:39:10</created>\n";
  out << "    <modified>2021-01-14T21:39:10</modified>\n";
  out << "    <unit name=\"meter\" meter=\"1\"/>\n";
  out << "    <up_axis>Y_UP</up_axis>\n";
  out << "  </asset>\n";
  out << "  <library_effects/>\n";
  out << "  <library_images/>\n";
  out << "  <library_materials/>\n";
  out << "  <library_geometries>\n";

  for (auto &&[name, node] : _pimpl->nodes)
  {
    out << "  <geometry id=\"" << name << "-mesh\" name=\"" << name << "\">\n";
    out << "    <mesh>\n";
    out << "      <source id=\"" << name << "-mesh-positions\">\n";
    out << "        <float_array id=\"" << name << "-mesh-positions-array\" count=\"" << node.vertexes.size() * 3 << "\">\n";
    for (auto [x, y, z] : node.vertexes)
    out << "          " << x << " " << y << " " << z << "\n";
    out << "        </float_array>\n";
    out << "        <technique_common>\n";
    out << "        <accessor source=\"#armbrawl_wing1-mesh-positions-array\" count=\"" << node.vertexes.size() << "\" stride=\"3\">\n";
    out << "            <param name=\"X\" type=\"float\"/>\n";
    out << "            <param name=\"Y\" type=\"float\"/>\n";
    out << "            <param name=\"Z\" type=\"float\"/>\n";
    out << "          </accessor>\n";
    out << "        </technique_common>\n";
    out << "      </source>\n";
    out << "      <vertices id=\"" << name << "-mesh-vertices\">\n";
    out << "        <input semantic=\"POSITION\" source=\"#" << name << "-mesh-positions\"/>\n";
    out << "      </vertices>\n";

    auto lines = std::vector<face_t>{};
    auto tris = std::vector<face_t>{};
    auto polys = std::vector<face_t>{};
    for (auto &&face : node.faces)
      if (face.size() == 2)
        lines.push_back(face);
      else if (face.size() == 3)
        tris.push_back(face);
      else if (face.size() > 3)
        polys.push_back(face);

    if (lines.size() > 0)
    {
      out << "      <lines count=\"" << lines.size() / 3 << "\">\n";
      out << "        <input semantic=\"VERTEX\" source=\"#" << name << "-mesh-vertices\" offset=\"0\"/>\n";
      out << "        <p>" << lines << "</p>\n";
      out << "      </lines>\n";
    }

    if (tris.size() > 0)
    {
      out << "      <triangles count=\"" << tris.size() / 3 << "\">\n";
      out << "        <input semantic=\"VERTEX\" source=\"#" << name << "-mesh-vertices\" offset=\"0\"/>\n";
      out << "        <p>" << tris << "</p>\n";
      out << "      </triangles>\n";
    }

    if (polys.size() > 0)
    {
      out << "      <polylist count=\"" << polys.size() / 3 << "\">\n";
      out << "        <input semantic=\"VERTEX\" source=\"#" << name << "-mesh-vertices\" offset=\"0\"/>\n";
      out << "        <vcount>";
      for (auto&& f : polys)
        out << f.size() << " ";
      out << "        </vcount>\n";
      out << "        <p>" << polys << "</p>\n";
      out << "      </polylist>\n";
    }


    out << "    </mesh>\n";
    out << "  </geometry>\n";
  }

  out << "  </library_geometries>\n";
  out << "  <library_visual_scenes>\n";
  out << "    <visual_scene id=\"Scene\" name=\"Scene\">\n";

  std::function<void(const node_t &, std::string)> print_node = [&](auto &&node, std::string indent) {
    out << indent << "<node id=\"" << node.id << "\" name=\"" << node.id << "\" type=\"NODE\">\n";
    out << indent << "  <translate sid=\"transform\">" << node.x << " " << node.y << " " << node.z << "</translate>\n";
    out << indent << "  <instance_geometry url=\"#" << node.id << "-mesh\" name=\"" << node.id << "\">\n";
    out << indent << "  </instance_geometry>\n";
    for (auto &[name, child] : _pimpl->nodes)
      if (child.parent == node.id)
        print_node(child, indent + "  ");
    out << indent << "</node>\n";
  };

  for (auto &[_, node] : _pimpl->nodes)
    if (node.parent.empty())
      print_node(node, "      ");

  out << "    </visual_scene>\n";
  out << "  </library_visual_scenes>\n";
  out << "  <scene>\n";
  out << "    <instance_visual_scene url=\"#Scene\"/>\n";
  out << "  </scene>\n";
  out << "</COLLADA>\n";
}
